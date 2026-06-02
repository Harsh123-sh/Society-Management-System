import AlertMessage from "./AlertMessage";

export default function AuthError({ message }) {
  return <AlertMessage type="error" message={message} />;
}
