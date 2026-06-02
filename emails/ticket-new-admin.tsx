import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./_layout";

export function TicketNewAdminEmail({
  clientName,
  title,
  description,
  type,
  ticketUrl,
}: {
  clientName: string;
  title: string;
  description: string;
  type: "modification" | "emergency";
  ticketUrl: string;
}) {
  const isEmergency = type === "emergency";
  return (
    <EmailLayout preview={`${isEmergency ? "EMERGENCY: " : "New request: "}${title}`}>
      <Text style={styles.h1}>
        {isEmergency ? "🚨 Emergency ticket" : "New change request"}
      </Text>
      <Text style={styles.p}>From: {clientName}</Text>
      <div
        style={
          isEmergency
            ? {
                ...styles.panel,
                backgroundColor: "rgba(244, 63, 94, 0.10)",
                border: "1px solid rgba(244, 63, 94, 0.35)",
              }
            : styles.panel
        }
      >
        <Text style={{ ...styles.p, margin: 0, fontWeight: 600 }}>{title}</Text>
        <Text style={{ ...styles.muted, marginTop: 8, whiteSpace: "pre-wrap" }}>{description}</Text>
      </div>
      <Button href={ticketUrl} style={styles.button}>
        {isEmergency ? "Open emergency ticket" : "Review & price"}
      </Button>
    </EmailLayout>
  );
}

export default TicketNewAdminEmail;
