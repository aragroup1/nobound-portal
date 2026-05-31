import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./_layout";

export function TicketCompleteEmail({
  name,
  title,
  ticketUrl,
}: {
  name: string;
  title: string;
  ticketUrl: string;
}) {
  return (
    <EmailLayout preview={`${title} is live`}>
      <Text style={styles.h1}>Your change is live.</Text>
      <Text style={styles.p}>Hi {name.split(" ")[0]},</Text>
      <Text style={styles.p}>
        We&apos;ve finished &ldquo;{title}&rdquo;. Take a look and let us know if anything needs tweaking.
      </Text>
      <Button href={ticketUrl} style={styles.button}>View request</Button>
    </EmailLayout>
  );
}

export default TicketCompleteEmail;
