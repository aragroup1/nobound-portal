import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const colors = {
  bg: "#05020d",
  card: "#0f0822",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.65)",
  border: "rgba(255,255,255,0.10)",
  primary: "#a855f7",
};

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "Inter, system-ui, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
          <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 24px" }}>
            NoBound<span style={{ color: colors.muted, fontSize: 12, marginLeft: 8, fontWeight: 400 }}>.design</span>
          </Text>
          <Section style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: "28px 28px 32px" }}>
            {children}
          </Section>
          <Hr style={{ borderColor: colors.border, margin: "28px 0 16px" }} />
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", margin: 0 }}>
            NoBound.Design · <Link href="https://nobound.design" style={{ color: colors.muted }}>nobound.design</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  h1: { fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 12px" } as const,
  p: { fontSize: 15, lineHeight: 1.6, color: colors.text, margin: "0 0 14px" } as const,
  muted: { fontSize: 13, color: colors.muted, margin: "0 0 14px" } as const,
  button: {
    display: "inline-block",
    backgroundColor: colors.primary,
    color: "#ffffff",
    padding: "12px 22px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
  } as const,
  panel: {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: "14px 16px",
    margin: "16px 0 20px",
  } as const,
  colors,
};
