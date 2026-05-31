import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./_layout";

export function TicketNewAdminEmail({
  clientName,
  title,
  description,
  ticketUrl,
}: {
  clientName: string;
  title: string;
  description: string;
  ticketUrl: string;
}) {
  return (
    <EmailLayout preview={`New request from ${clientName}: ${title}`}>
      <Text style={styles.h1}>New change request</Text>
      <Text style={styles.p}>From: {clientName}</Text>
      <div style={styles.panel}>
        <Text style={{ ...styles.p, margin: 0, fontWeight: 600 }}>{title}</Text>
        <Text style={{ ...styles.muted, marginTop: 8, whiteSpace: "pre-wrap" }}>{description}</Text>
      </div>
      <Button href={ticketUrl} style={styles.button}>Review & price</Button>
    </EmailLayout>
  );
}

export default TicketNewAdminEmail;
