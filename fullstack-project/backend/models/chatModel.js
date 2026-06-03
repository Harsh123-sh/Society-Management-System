const db = require("../db");

const THREAD_TYPES = ["direct", "group", "channel"];
const MESSAGE_TYPES = ["text", "image", "video", "audio", "file", "pdf", "system"];

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function fromJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

async function getChatActorContext(userId) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.role, u.status, u.society_id, u.flat_number, u.resident_type,
            s.code AS society_code, s.slug AS society_slug, s.subdomain AS society_subdomain
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );

  const user = rows[0] || null;
  if (!user) return null;

  if (!["resident", "admin", "secretary", "staff", "security", "super_admin"].includes(user.role) || user.status !== "active") {
    return null;
  }

  return user;
}

async function getChatMemberById(memberId) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.flat_number, u.society_id, u.role, u.status,
            COALESCE(f.wing, '-') AS wing,
            COALESCE(f.floor, '-') AS floor,
            u.resident_type,
            s.code AS society_code
     FROM users u
     LEFT JOIN flat_residents fr ON fr.resident_id = u.id AND fr.is_active = 1
     LEFT JOIN flats f ON f.id = fr.flat_id
     LEFT JOIN societies s ON s.id = u.society_id
     WHERE u.id = ?
       AND u.role IN ('resident', 'admin', 'secretary', 'staff', 'security', 'super_admin')
       AND u.status = 'active'
     LIMIT 1`,
    [memberId]
  );

  return rows[0] || null;
}

async function getChatMembersForUser({ currentUserId, currentRole, societyId, search = "" }) {
  const params = [currentUserId];
  let filters = "AND u.status = 'active'";

  if (currentRole === "resident") {
    filters += ` AND (
      u.role IN ('admin', 'secretary', 'staff', 'security')
      OR (u.role = 'resident' AND u.society_id = ?)
    )`;
    params.push(societyId || null);
  } else if (currentRole === "staff" || currentRole === "security") {
    filters += " AND u.society_id = ?";
    params.push(societyId || null);
  } else if (currentRole === "admin" || currentRole === "secretary") {
    filters += " AND u.society_id = ?";
    params.push(societyId || null);
  }

  if (search) {
    const likeSearch = `%${search}%`;
    filters += " AND (u.name LIKE ? OR u.flat_number LIKE ? OR f.wing LIKE ? OR s.code LIKE ?)";
    params.push(likeSearch, likeSearch, likeSearch, likeSearch);
  }

  const { rows } = await db.query(
    `SELECT u.id, u.name, u.flat_number, u.role, u.resident_type,
            COALESCE(f.wing, '-') AS wing,
            COALESCE(f.floor, '-') AS floor,
            u.status,
            s.code AS society_code,
            s.slug AS society_slug,
            s.subdomain AS society_subdomain
     FROM users u
     LEFT JOIN flat_residents fr ON fr.resident_id = u.id AND fr.is_active = 1
     LEFT JOIN flats f ON f.id = fr.flat_id
     LEFT JOIN societies s ON s.id = u.society_id
     WHERE u.id <> ?
       ${filters}
     ORDER BY
       CASE WHEN u.role = 'super_admin' THEN -1 WHEN u.role = 'admin' THEN 0 WHEN u.role = 'secretary' THEN 1 WHEN u.role = 'staff' THEN 2 WHEN u.role = 'security' THEN 3 ELSE 4 END,
       s.code ASC,
       f.wing ASC,
       u.flat_number ASC,
       u.name ASC`,
    params
  );

  return rows;
}

async function ensureThreadMember(connection, threadId, userId, memberRole = "member") {
  await connection.query(
    `INSERT INTO chat_thread_members (thread_id, user_id, member_role)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE member_role = VALUES(member_role), left_at = NULL`,
    [threadId, userId, memberRole]
  );
}

async function getThreadById(threadId) {
  const { rows } = await db.query(
    `SELECT id, society_id, thread_type, title, description, avatar_url, created_by,
            last_message_at, pinned_message_id, archived_at, created_at, updated_at
     FROM chat_threads
     WHERE id = ?
     LIMIT 1`,
    [threadId]
  );

  return rows[0] || null;
}

async function getThreadMembers(threadId) {
  const { rows } = await db.query(
    `SELECT tm.thread_id, tm.user_id, tm.member_role, tm.joined_at, tm.left_at, tm.muted_until,
            tm.last_read_message_id, tm.last_delivered_message_id,
            u.name, u.email, u.role, u.status, u.flat_number, u.society_id,
            COALESCE(f.wing, '-') AS wing,
            COALESCE(f.floor, '-') AS floor
     FROM chat_thread_members tm
     JOIN users u ON u.id = tm.user_id
     LEFT JOIN flat_residents fr ON fr.resident_id = u.id AND fr.is_active = 1
     LEFT JOIN flats f ON f.id = fr.flat_id
     WHERE tm.thread_id = ?
       AND tm.left_at IS NULL
     ORDER BY tm.member_role = 'owner' DESC, tm.member_role = 'admin' DESC, u.name ASC`,
    [threadId]
  );

  return rows;
}

async function getDirectThreadBetweenUsers(userId, peerId) {
  const { rows } = await db.query(
    `SELECT t.id
     FROM chat_threads t
     JOIN chat_thread_members m1 ON m1.thread_id = t.id AND m1.user_id = ? AND m1.left_at IS NULL
     JOIN chat_thread_members m2 ON m2.thread_id = t.id AND m2.user_id = ? AND m2.left_at IS NULL
     WHERE t.thread_type = 'direct'
       AND (
         SELECT COUNT(*)
         FROM chat_thread_members tm
         WHERE tm.thread_id = t.id
           AND tm.left_at IS NULL
       ) = 2
     LIMIT 1`,
    [userId, peerId]
  );

  return rows[0]?.id || null;
}

async function createThread({ createdBy, societyId = null, threadType = "direct", title = null, description = null, avatarUrl = null, memberIds = [] }) {
  const selectedThreadType = THREAD_TYPES.includes(threadType) ? threadType : "direct";
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [threadResult] = await connection.query(
      `INSERT INTO chat_threads (society_id, thread_type, title, description, avatar_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [societyId || null, selectedThreadType, title, description, avatarUrl, createdBy]
    );

    const threadId = threadResult.insertId;
    const members = Array.from(new Set([createdBy, ...memberIds].map((memberId) => Number(memberId)).filter(Boolean)));

    for (const memberId of members) {
      await ensureThreadMember(connection, threadId, memberId, memberId === createdBy ? "owner" : "member");
    }

    await connection.commit();
    return getThreadById(threadId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function ensureDirectThread({ userId, peerId, societyId = null }) {
  const existingThreadId = await getDirectThreadBetweenUsers(userId, peerId);
  if (existingThreadId) {
    return getThreadById(existingThreadId);
  }

  return createThread({
    createdBy: userId,
    societyId,
    threadType: "direct",
    title: null,
    memberIds: [peerId],
  });
}

async function listThreadsForUser(userId) {
  const { rows } = await db.query(
    `SELECT t.id, t.society_id, t.thread_type, t.title, t.description, t.avatar_url, t.created_by,
            t.last_message_at, t.pinned_message_id, t.archived_at, t.created_at, t.updated_at,
            latest.id AS latest_message_id,
            latest.sender_id AS latest_sender_id,
            latest.receiver_id AS latest_receiver_id,
            latest.message_type AS latest_message_type,
            latest.message AS latest_message,
            latest.media_url AS latest_media_url,
            latest.media_name AS latest_media_name,
            latest.mime_type AS latest_mime_type,
            latest.created_at AS latest_created_at,
            peer.name AS peer_name,
            peer.id AS peer_id,
            peer.role AS peer_role,
            peer.flat_number AS peer_flat_number,
            peer.society_id AS peer_society_id,
            COALESCE(f.wing, '-') AS peer_wing,
            COALESCE(f.floor, '-') AS peer_floor,
            SUM(CASE WHEN r.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
     FROM chat_threads t
     JOIN chat_thread_members tm ON tm.thread_id = t.id AND tm.user_id = ? AND tm.left_at IS NULL
     LEFT JOIN chat_messages latest ON latest.id = (
       SELECT cm.id
       FROM chat_messages cm
       WHERE cm.thread_id = t.id
         AND cm.deleted_for_all = 0
         AND (
           cm.deleted_for_sender = 0
           OR cm.sender_id <> ?
         )
         AND (
           cm.deleted_for_receiver = 0
           OR cm.sender_id = ?
         )
       ORDER BY cm.created_at DESC, cm.id DESC
       LIMIT 1
     )
     LEFT JOIN chat_message_receipts r ON r.message_id = latest.id AND r.user_id = ?
     LEFT JOIN chat_thread_members peer_member ON peer_member.thread_id = t.id AND peer_member.user_id <> ? AND peer_member.left_at IS NULL
     LEFT JOIN users peer ON peer.id = peer_member.user_id
     LEFT JOIN flat_residents fr ON fr.resident_id = peer.id AND fr.is_active = 1
     LEFT JOIN flats f ON f.id = fr.flat_id
     GROUP BY t.id, latest.id, peer.id, f.wing, f.floor
     ORDER BY COALESCE(t.last_message_at, t.created_at) DESC, t.id DESC`,
    [userId, userId, userId, userId, userId]
  );

  return rows.map((row) => ({
    id: row.id,
    society_id: row.society_id,
    thread_type: row.thread_type,
    title: row.title,
    description: row.description,
    avatar_url: row.avatar_url,
    created_by: row.created_by,
    last_message_at: row.last_message_at,
    pinned_message_id: row.pinned_message_id,
    archived_at: row.archived_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    latest_message: row.latest_message_id
      ? {
          id: row.latest_message_id,
          sender_id: row.latest_sender_id,
          receiver_id: row.latest_receiver_id,
          message_type: row.latest_message_type,
          message: row.latest_message,
          media_url: row.latest_media_url,
          media_name: row.latest_media_name,
          mime_type: row.latest_mime_type,
          created_at: row.latest_created_at,
        }
      : null,
    peer_name: row.peer_name,
    peer_id: row.peer_id,
    peer_role: row.peer_role,
    peer_flat_number: row.peer_flat_number,
    peer_society_id: row.peer_society_id,
    peer_wing: row.peer_wing,
    peer_floor: row.peer_floor,
    unread_count: Number(row.unread_count || 0),
  }));
}

async function getConversations(currentUserId) {
  return listThreadsForUser(currentUserId);
}

async function getThreadMessages({ threadId, currentUserId, limit = 200, search = "" }) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 500) : 200;
  const searchClause = search ? "AND (m.message LIKE ? OR m.media_name LIKE ? OR m.message_type LIKE ?)" : "";
  const params = [threadId, currentUserId, currentUserId];
  if (search) {
    const likeSearch = `%${search}%`;
    params.push(likeSearch, likeSearch, likeSearch);
  }
  params.push(safeLimit);

  const { rows } = await db.query(
    `SELECT m.id, m.thread_id, m.sender_id, m.receiver_id, m.message_type, m.message,
            m.media_url, m.media_name, m.media_size, m.mime_type, m.thumbnail_url,
            m.reply_to_message_id, m.is_pinned, m.pinned_by, m.pinned_at,
            m.metadata_json, m.deleted_for_sender, m.deleted_for_receiver, m.deleted_for_all,
            m.deleted_for_all_by, m.deleted_for_all_at, m.created_at, m.updated_at,
            sender.name AS sender_name,
            sender.role AS sender_role,
            sender.flat_number AS sender_flat_number,
            sender.society_id AS sender_society_id,
            receiver.name AS receiver_name,
            receiver.role AS receiver_role,
            COALESCE((
              SELECT JSON_ARRAYAGG(JSON_OBJECT('user_id', r.user_id, 'reaction', r.reaction, 'created_at', r.created_at))
              FROM chat_message_reactions r
              WHERE r.message_id = m.id
            ), JSON_ARRAY()) AS reactions_json,
            COALESCE((
              SELECT JSON_ARRAYAGG(JSON_OBJECT('user_id', rc.user_id, 'delivered_at', rc.delivered_at, 'read_at', rc.read_at))
              FROM chat_message_receipts rc
              WHERE rc.message_id = m.id
            ), JSON_ARRAY()) AS receipts_json,
            reply.message AS reply_message,
            reply.message_type AS reply_message_type,
            pinned_by.name AS pinned_by_name,
            deleter.name AS deleted_for_all_by_name
     FROM chat_messages m
     JOIN users sender ON sender.id = m.sender_id
     LEFT JOIN users receiver ON receiver.id = m.receiver_id
     LEFT JOIN chat_messages reply ON reply.id = m.reply_to_message_id
     LEFT JOIN users pinned_by ON pinned_by.id = m.pinned_by
     LEFT JOIN users deleter ON deleter.id = m.deleted_for_all_by
     JOIN chat_thread_members current_member ON current_member.thread_id = m.thread_id AND current_member.user_id = ? AND current_member.left_at IS NULL
     WHERE m.thread_id = ?
       AND (
         m.deleted_for_all = 1
         OR (m.sender_id = ? AND m.deleted_for_sender = 0)
         OR (m.sender_id <> ? AND m.deleted_for_receiver = 0)
       )
       ${searchClause}
     ORDER BY m.created_at ASC, m.id ASC
     LIMIT ?`,
    params
  );

  return rows.map((row) => ({
    ...row,
    metadata_json: fromJson(row.metadata_json, {}),
    reactions: fromJson(row.reactions_json, []),
    receipts: fromJson(row.receipts_json, []),
  }));
}

async function getMessagesBetweenMembers({ currentUserId, memberId, limit = 200 }) {
  const thread = await ensureDirectThread({
    userId: currentUserId,
    peerId: memberId,
    societyId: null,
  });

  return getThreadMessages({ threadId: thread.id, currentUserId, limit });
}

async function createMessage({
  threadId = null,
  senderId,
  receiverId = null,
  message = null,
  messageType = "text",
  mediaUrl = null,
  mediaName = null,
  mediaSize = null,
  mimeType = null,
  thumbnailUrl = null,
  replyToMessageId = null,
  metadata = {},
}) {
  const selectedMessageType = MESSAGE_TYPES.includes(messageType) ? messageType : "text";
  let targetThreadId = threadId;

  if (!targetThreadId) {
    if (!receiverId) {
      throw new Error("threadId or receiverId is required");
    }
    const thread = await ensureDirectThread({ userId: senderId, peerId: receiverId, societyId: null });
    targetThreadId = thread.id;
  }

  const { rows: result } = await db.query(
    `INSERT INTO chat_messages (
      thread_id, sender_id, receiver_id, message_type, message, media_url, media_name,
      media_size, mime_type, thumbnail_url, reply_to_message_id, metadata_json
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      targetThreadId,
      senderId,
      receiverId,
      selectedMessageType,
      message,
      mediaUrl,
      mediaName,
      mediaSize,
      mimeType,
      thumbnailUrl,
      replyToMessageId,
      toJson(metadata),
    ]
  );

  await db.query("UPDATE chat_threads SET last_message_at = NOW() WHERE id = ?", [targetThreadId]);

  const { rows: memberRows } = await db.query(
    `SELECT user_id
     FROM chat_thread_members
     WHERE thread_id = ?
       AND left_at IS NULL`,
    [targetThreadId]
  );

  for (const member of memberRows) {
    if (Number(member.user_id) === Number(senderId)) {
      continue;
    }
    await db.query(
      `INSERT INTO chat_message_receipts (message_id, user_id, delivered_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE delivered_at = COALESCE(delivered_at, VALUES(delivered_at))`,
      [result.insertId, member.user_id]
    );
  }

  return result.insertId;
}

async function getMessageById(messageId) {
  const { rows } = await db.query(
    `SELECT m.id, m.thread_id, m.sender_id, m.receiver_id, m.message_type, m.message,
            m.media_url, m.media_name, m.media_size, m.mime_type, m.thumbnail_url,
            m.reply_to_message_id, m.is_pinned, m.pinned_by, m.pinned_at,
            m.metadata_json, m.deleted_for_sender, m.deleted_for_receiver, m.deleted_for_all,
            m.deleted_for_all_by, m.deleted_for_all_at, m.created_at, m.updated_at,
            sender.name AS sender_name,
            sender.role AS sender_role,
            receiver.name AS receiver_name,
            receiver.role AS receiver_role,
            reply.message AS reply_message,
            reply.message_type AS reply_message_type,
            pinned_by.name AS pinned_by_name,
            deleter.name AS deleted_for_all_by_name,
            COALESCE((
              SELECT JSON_ARRAYAGG(JSON_OBJECT('user_id', r.user_id, 'reaction', r.reaction, 'created_at', r.created_at))
              FROM chat_message_reactions r
              WHERE r.message_id = m.id
            ), JSON_ARRAY()) AS reactions_json,
            COALESCE((
              SELECT JSON_ARRAYAGG(JSON_OBJECT('user_id', rc.user_id, 'delivered_at', rc.delivered_at, 'read_at', rc.read_at))
              FROM chat_message_receipts rc
              WHERE rc.message_id = m.id
            ), JSON_ARRAY()) AS receipts_json
     FROM chat_messages m
     JOIN users sender ON sender.id = m.sender_id
     LEFT JOIN users receiver ON receiver.id = m.receiver_id
     LEFT JOIN chat_messages reply ON reply.id = m.reply_to_message_id
     LEFT JOIN users pinned_by ON pinned_by.id = m.pinned_by
     LEFT JOIN users deleter ON deleter.id = m.deleted_for_all_by
     WHERE m.id = ?
     LIMIT 1`,
    [messageId]
  );

  const row = rows[0] || null;
  if (!row) return null;

  return {
    ...row,
    metadata_json: fromJson(row.metadata_json, {}),
    reactions: fromJson(row.reactions_json, []),
    receipts: fromJson(row.receipts_json, []),
  };
}

async function markMessageDelivered({ messageId, userId }) {
  await db.query(
    `INSERT INTO chat_message_receipts (message_id, user_id, delivered_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE delivered_at = COALESCE(delivered_at, VALUES(delivered_at))`,
    [messageId, userId]
  );
}

async function markThreadRead({ threadId, userId, messageId = null }) {
  const whereClause = messageId ? "AND id <= ?" : "";
  const params = [threadId, userId];
  if (messageId) params.push(messageId);

  const { rows: messages } = await db.query(
    `SELECT id
     FROM chat_messages
     WHERE thread_id = ?
       AND sender_id <> ?
       ${whereClause}`,
    params
  );

  for (const row of messages) {
    await db.query(
      `INSERT INTO chat_message_receipts (message_id, user_id, delivered_at, read_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         delivered_at = COALESCE(delivered_at, VALUES(delivered_at)),
         read_at = COALESCE(read_at, VALUES(read_at))`,
      [row.id, userId]
    );
  }

  await db.query(
    `UPDATE chat_thread_members
     SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), ?)
     WHERE thread_id = ? AND user_id = ?`,
    [messageId || 0, threadId, userId]
  );
}

async function reactToMessage({ messageId, userId, reaction }) {
  const selectedReaction = String(reaction || "").trim();
  if (!selectedReaction) {
    return null;
  }

  await db.query(
    `INSERT INTO chat_message_reactions (message_id, user_id, reaction)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)`,
    [messageId, userId, selectedReaction]
  );

  return getMessageById(messageId);
}

async function pinMessage({ messageId, userId, pinned = true }) {
  await db.query(
    `UPDATE chat_messages
     SET is_pinned = ?, pinned_by = ?, pinned_at = ?
     WHERE id = ?`,
    [pinned ? 1 : 0, pinned ? userId : null, pinned ? new Date() : null, messageId]
  );

  return getMessageById(messageId);
}

async function searchMessages({ userId, query, limit = 50 }) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 50;
  const likeQuery = `%${query}%`;

  const { rows } = await db.query(
    `SELECT m.id, m.thread_id, m.sender_id, m.receiver_id, m.message_type, m.message,
            m.media_url, m.media_name, m.media_size, m.mime_type, m.thumbnail_url,
            m.created_at, sender.name AS sender_name
     FROM chat_messages m
     JOIN chat_thread_members tm ON tm.thread_id = m.thread_id AND tm.user_id = ? AND tm.left_at IS NULL
     JOIN users sender ON sender.id = m.sender_id
     WHERE (m.message LIKE ? OR m.media_name LIKE ? OR m.message_type LIKE ?)
       AND m.deleted_for_all = 0
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT ?`,
    [userId, likeQuery, likeQuery, likeQuery, safeLimit]
  );

  return rows;
}

async function softDeleteMessageForMe({ messageId, userId }) {
  const { rows: ownedRows } = await db.query(
    `SELECT id, sender_id, receiver_id, thread_id
     FROM chat_messages
     WHERE id = ?
     LIMIT 1`,
    [messageId]
  );

  const message = ownedRows[0] || null;
  if (!message) return { found: false, updated: false };

  if (message.sender_id !== userId && message.receiver_id !== userId) {
    return { found: true, updated: false, unauthorized: true };
  }

  if (message.sender_id === userId) {
    const { rows: result } = await db.query(
      "UPDATE chat_messages SET deleted_for_sender = 1 WHERE id = ?",
      [messageId]
    );
    return { found: true, updated: result.affectedRows > 0 };
  }

  const { rows: result } = await db.query(
    "UPDATE chat_messages SET deleted_for_receiver = 1 WHERE id = ?",
    [messageId]
  );
  return { found: true, updated: result.affectedRows > 0 };
}

async function deleteMessageForEveryone({ messageId, userId }) {
  const { rows: ownedRows } = await db.query(
    `SELECT id, sender_id, receiver_id, deleted_for_all
     FROM chat_messages
     WHERE id = ?
     LIMIT 1`,
    [messageId]
  );

  const message = ownedRows[0] || null;
  if (!message) return { found: false, updated: false };

  if (message.sender_id !== userId) {
    return { found: true, updated: false, unauthorized: true };
  }

  const { rows: result } = await db.query(
    `UPDATE chat_messages
     SET deleted_for_all = 1,
         deleted_for_all_by = ?,
         deleted_for_all_at = NOW()
     WHERE id = ?`,
    [userId, messageId]
  );

  return { found: true, updated: result.affectedRows > 0 };
}

module.exports = {
  getChatActorContext,
  getChatMemberById,
  getChatMembersForUser,
  createThread,
  ensureDirectThread,
  listThreadsForUser,
  getThreadById,
  getThreadMembers,
  getDirectThreadBetweenUsers,
  createMessage,
  getMessageById,
  markMessageDelivered,
  markThreadRead,
  reactToMessage,
  pinMessage,
  searchMessages,
  getMessagesBetweenMembers,
  getConversations,
  getThreadMessages,
  softDeleteMessageForMe,
  deleteMessageForEveryone,
  fromJson,
  toJson,
};
