import { ConfigService } from "@nestjs/config";
import { SMTPServer } from "smtp-server";
import type { AddressInfo } from "node:net";
import { simpleParser } from "mailparser";
import { SmtpEmailProvider } from "./smtp-email.provider";

// Verifies the real adapter against a real (if minimal) SMTP server speaking the real
// protocol — not a mocked nodemailer transport — so this actually proves the provider can
// talk SMTP, not just that it calls a library correctly. Mirrors this project's established
// practice of testing integrations against something real rather than asserting mocks.
describe("SmtpEmailProvider (against a real local SMTP server)", () => {
  let server: SMTPServer;
  let port: number;
  let received: { from: string; to: string[]; raw: string }[];

  beforeAll(async () => {
    received = [];
    server = new SMTPServer({
      disabledCommands: ["AUTH", "STARTTLS"],
      onData(stream, session, callback) {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => {
          received.push({
            from: session.envelope.mailFrom ? session.envelope.mailFrom.address : "",
            to: session.envelope.rcptTo.map((r) => r.address),
            raw: Buffer.concat(chunks).toString("utf8"),
          });
          callback();
        });
      },
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = (server.server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  function makeProvider(): SmtpEmailProvider {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        smtpHost: "127.0.0.1",
        smtpPort: port,
        smtpSecure: false,
        smtpUser: null,
        smtpPassword: null,
        fromAddress: "no-reply@ember.example.com",
        fromName: "Ember",
        enabled: true,
      }),
    } as unknown as ConfigService;
    return new SmtpEmailProvider(configService);
  }

  it("delivers a verification email with the correct recipient, subject, and link", async () => {
    const provider = makeProvider();

    const result = await provider.sendTransactional({
      to: "test-user@example.com",
      templateKey: "email-verification",
      variables: { verificationLink: "https://ember.example.com/verify?token=abc123", expiresInHours: "24" },
    });

    expect(result.providerMessageId).toEqual(expect.any(String));
    expect(received).toHaveLength(1);
    expect(received[0].to).toEqual(["test-user@example.com"]);

    const parsed = await simpleParser(received[0].raw);
    expect(parsed.subject).toBe("Verify your email address");
    expect(parsed.text).toContain("https://ember.example.com/verify?token=abc123");
    expect(parsed.html).toContain("https://ember.example.com/verify?token=abc123");
  });

  it("escapes HTML-unsafe characters in template variables (no injection into the rendered email)", async () => {
    const provider = makeProvider();

    await provider.sendTransactional({
      to: "victim@example.com",
      templateKey: "new-device-login-alert",
      variables: { ipAddress: "1.2.3.4", userAgent: '<img src=x onerror=alert(1)>' },
    });

    const parsed = await simpleParser(received[received.length - 1].raw);
    expect(parsed.html).not.toContain("<img src=x onerror=alert(1)>");
    expect(parsed.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("throws (does not silently swallow) a permanent SMTP rejection", async () => {
    // A server that rejects every RCPT TO with a permanent 5xx, simulating a hard bounce.
    const rejectingServer = new SMTPServer({
      disabledCommands: ["AUTH", "STARTTLS"],
      onRcptTo(_address, _session, callback) {
        callback(Object.assign(new Error("Mailbox does not exist"), { responseCode: 550 }));
      },
    });
    await new Promise<void>((resolve) => rejectingServer.listen(0, "127.0.0.1", resolve));
    const rejectingPort = (rejectingServer.server.address() as AddressInfo).port;

    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        smtpHost: "127.0.0.1",
        smtpPort: rejectingPort,
        smtpSecure: false,
        smtpUser: null,
        smtpPassword: null,
        fromAddress: "no-reply@ember.example.com",
        fromName: "Ember",
        enabled: true,
      }),
    } as unknown as ConfigService;
    const provider = new SmtpEmailProvider(configService);

    await expect(
      provider.sendTransactional({
        to: "bounced@example.com",
        templateKey: "password-reset",
        variables: { resetLink: "https://x", expiresInMinutes: "30" },
      }),
    ).rejects.toThrow();

    await new Promise<void>((resolve) => rejectingServer.close(() => resolve()));
  });
});
