import AlertMessage from "./AlertMessage";

export default function AuthSuccess({ message }) {
  return <AlertMessage type="success" message={message} />;
}
