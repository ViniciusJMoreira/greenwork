import nodemailer from "nodemailer";
import { calcMin, fmtOre } from "@/lib/utils";

export async function POST(request) {
  try {
    const { operaio, registri } = await request.json();

    const minutiTotali = registri.reduce(
      (acc, r) => acc + calcMin(r.inizio, r.fine),
      0,
    );
    const giorniSet = new Set(registri.map((r) => r.data));

    // Raggruppa ore per cantiere
    const cantierMap = {};
    registri.forEach((r) => {
      const min = calcMin(r.inizio, r.fine);
      if (!cantierMap[r.cantiere]) {
        cantierMap[r.cantiere] = { min: 0, codice: r.codice ?? "" };
      }
      cantierMap[r.cantiere].min += min;
    });

    const dettaglioCantieri = Object.entries(cantierMap)
      .sort((a, b) => b[1].min - a[1].min)
      .map(
        ([nome, { min, codice }]) =>
          `<tr>
          <td style="padding:4px 8px">${nome}</td>
          <td style="padding:4px 8px;font-family:monospace">${codice}</td>
          <td style="padding:4px 8px;font-weight:bold">${fmtOre(min)}</td>
        </tr>`,
      )
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#14532d;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">🌿 GreenWork — Riepilogo Ore</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
          <table style="width:100%;margin-bottom:20px">
            <tr>
              <td style="color:#6b7280;padding:4px 0">Operaio</td>
              <td style="font-weight:bold;padding:4px 0">${operaio}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;padding:4px 0">Ore Totali</td>
              <td style="font-weight:bold;color:#16a34a;font-size:18px;padding:4px 0">${fmtOre(minutiTotali)}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;padding:4px 0">Giorni lavorati</td>
              <td style="font-weight:bold;padding:4px 0">${giorniSet.size}</td>
            </tr>
          </table>

          <h3 style="color:#166534;margin-bottom:8px">Dettaglio Cantieri</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#dcfce7">
                <th style="padding:6px 8px;text-align:left">Cantiere</th>
                <th style="padding:6px 8px;text-align:left">Codice</th>
                <th style="padding:6px 8px;text-align:left">Ore</th>
              </tr>
            </thead>
            <tbody>${dettaglioCantieri}</tbody>
          </table>
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `GreenWork <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO || "viniciusit.moreira@gmail.com",
      subject: `GreenWork — Riepilogo ore di ${operaio}`,
      html,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("send-email error:", err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
