import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { company } from "./config";
import { resolveLogoDataUri } from "./logo";

export type PdfData = {
  docLabel: string;
  number: string;
  dateLabel: string;
  dateValue: string;
  customer: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    mrc: number;
    lineTotal: number;
  }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  mrcTotal: number;
  notes?: string | null;
};

function fmt(n: number) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#334155", fontFamily: "Helvetica" },
  row: { flexDirection: "row" },
  spaceBetween: { flexDirection: "row", justifyContent: "space-between" },
  company: { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  logo: { maxHeight: 46, maxWidth: 180, marginBottom: 6, objectFit: "contain" },
  muted: { color: "#64748b" },
  docLabel: { fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
  docNumber: { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  sectionLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  billName: { fontWeight: 700, color: "#0f172a" },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 6,
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
  },
  cDesc: { width: "44%" },
  cQty: { width: "12%", textAlign: "right" },
  cUnit: { width: "14%", textAlign: "right" },
  cMrc: { width: "14%", textAlign: "right" },
  cAmt: { width: "16%", textAlign: "right" },
  th: { fontSize: 8, color: "#64748b", textTransform: "uppercase" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 6,
    marginTop: 4,
  },
  bold: { fontWeight: 700, color: "#0f172a" },
  notes: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8,
  },
});

function DocumentPdf({ data, logo }: { data: PdfData; logo?: string | null }) {
  const cityLine = [data.customer.city, data.customer.state]
    .filter(Boolean)
    .join(", ");
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.spaceBetween}>
          <View>
            {logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logo} style={styles.logo} />
            ) : null}
            <Text style={styles.company}>{company.name}</Text>
            {!!company.address && <Text style={styles.muted}>{company.address}</Text>}
            {!!company.phone && <Text style={styles.muted}>{company.phone}</Text>}
            {!!company.email && <Text style={styles.muted}>{company.email}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docLabel}>{data.docLabel}</Text>
            <Text style={styles.docNumber}>{data.number}</Text>
            <Text style={styles.muted}>
              {data.dateLabel}: {data.dateValue}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionLabel}>Bill to</Text>
          <Text style={styles.billName}>{data.customer.company || data.customer.name}</Text>
          {data.customer.company && <Text>{data.customer.name}</Text>}
          {!!data.customer.address && <Text>{data.customer.address}</Text>}
          {(cityLine || data.customer.zip) && (
            <Text>
              {cityLine} {data.customer.zip}
            </Text>
          )}
          {!!data.customer.email && <Text style={styles.muted}>{data.customer.email}</Text>}
          {!!data.customer.phone && <Text style={styles.muted}>{data.customer.phone}</Text>}
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.cDesc, styles.th]}>Description</Text>
          <Text style={[styles.cQty, styles.th]}>Qty</Text>
          <Text style={[styles.cUnit, styles.th]}>Unit</Text>
          <Text style={[styles.cMrc, styles.th]}>MRC/mo</Text>
          <Text style={[styles.cAmt, styles.th]}>Amount</Text>
        </View>
        {data.lineItems.map((li, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.cDesc}>{li.description}</Text>
            <Text style={styles.cQty}>{li.quantity}</Text>
            <Text style={styles.cUnit}>{fmt(li.unitPrice)}</Text>
            <Text style={styles.cMrc}>{li.mrc ? fmt(li.mrc) : "—"}</Text>
            <Text style={styles.cAmt}>{fmt(li.lineTotal)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{fmt(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Tax ({(data.taxRate * 100).toFixed(2)}%)</Text>
            <Text>{fmt(data.taxAmount)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.bold}>Total</Text>
            <Text style={styles.bold}>{fmt(data.total)}</Text>
          </View>
          {data.mrcTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Monthly recurring</Text>
              <Text>{fmt(data.mrcTotal)}/mo</Text>
            </View>
          )}
        </View>

        {!!data.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          {company.name} · Thank you for your business
        </Text>
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(data: PdfData): Promise<Buffer> {
  const logo = await resolveLogoDataUri();
  return renderToBuffer(<DocumentPdf data={data} logo={logo} />);
}
