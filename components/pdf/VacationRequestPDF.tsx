import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
  },
  logoContainer: {
    alignItems: "flex-end",
  },
  logoAccent: {
    flexDirection: "row",
    marginBottom: 2,
  },
  logoAccentLine: {
    width: 4,
    height: 1.5,
    backgroundColor: "#eccf1d",
    marginRight: 1,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2b2e4d",
    marginBottom: 1,
  },
  logoSubtext: {
    fontSize: 8,
    color: "#2b2e4d",
  },
  logoBottomAccent: {
    flexDirection: "row",
    marginTop: 2,
  },
  logoBottomAccentLine: {
    width: 3,
    height: 1,
    backgroundColor: "#eccf1d",
    marginRight: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: "#888",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#888",
    minHeight: 45,
  },
  labelCell: {
    width: "30%",
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#888",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  valueCell: {
    width: "70%",
    padding: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  labelText: {
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "left",
  },
  valueText: {
    fontSize: 10,
    textAlign: "left",
  },
  dateVacationContainer: {
    flexDirection: "row",
    width: "100%",
  },
  dateVacationCell: {
    width: "50%",
    padding: 8,
  },
  dateVacationLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "left",
  },
  dateVacationValue: {
    fontSize: 10,
    textAlign: "left",
  },
});

interface VacationRequestPDFProps {
  employeeName: string;
  dateRequest: string;
  dateFrom: string;
  dateTo: string;
}

export function VacationRequestPDF({
  employeeName,
  dateRequest,
  dateFrom,
  dateTo,
}: VacationRequestPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: Title (left) and Logo (right) */}
        <View style={styles.header}>
          <Text style={styles.title}>Antrag auf Urlaub</Text>
          <View style={styles.logoContainer}>
            {/* Main text */}
            <Text style={styles.logoText}>TETRASAN</Text>
            <Text style={styles.logoSubtext}>Zukunftslösungen HEUTE</Text>
          </View>
        </View>

        {/* Table: Row-based layout */}
        <View style={styles.table}>
          {/* Row 1: Name */}
          <View style={styles.tableRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Name</Text>
            </View>
            <View style={styles.valueCell}>
              <Text style={styles.valueText}>{employeeName}</Text>
            </View>
          </View>

          {/* Row 2: Datum Antrag */}
          <View style={styles.tableRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Datum Antrag</Text>
            </View>
            <View style={styles.valueCell}>
              <Text style={styles.valueText}>{dateRequest}</Text>
            </View>
          </View>

          {/* Row 3: Datum Urlaub (with von/bis split horizontally) */}
          <View style={styles.tableRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Datum Urlaub</Text>
            </View>
            <View style={styles.valueCell}>
              <View style={styles.dateVacationContainer}>
                <View style={styles.dateVacationCell}>
                  <Text style={styles.dateVacationLabel}>von</Text>
                  <Text style={styles.dateVacationValue}>{dateFrom}</Text>
                </View>
                <View style={styles.dateVacationCell}>
                  <Text style={styles.dateVacationLabel}>bis</Text>
                  <Text style={styles.dateVacationValue}>{dateTo}</Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}
