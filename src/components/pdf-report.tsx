'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0D9488', // Teal 600
    paddingBottom: 15,
    marginBottom: 25,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D9488',
  },
  headerDate: {
    fontSize: 10,
    color: '#64748B',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  gridItem: {
    width: '30%',
  },
  label: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: 'medium',
  },
  contentBlock: {
    marginBottom: 15,
  },
  contentLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#94A3B8',
  }
})

interface PDFReportProps {
  data: {
    title: string
    created_at: string
    animal_name: string
    animal_species: string
    tutor_name: string
    structured_content: any
    vet_summary?: string
  }
}

export const PDFReport = ({ data }: PDFReportProps) => {
  const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ProntuVet AI</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E293B' }}>Prontuário Clínico</Text>
            <Text style={styles.headerDate}>{formattedDate}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do Paciente</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Animal</Text>
              <Text style={styles.value}>{data.animal_name || 'Não informado'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Espécie</Text>
              <Text style={styles.value}>{data.animal_species || 'Não informado'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Tutor</Text>
              <Text style={styles.value}>{data.tutor_name || 'Não informado'}</Text>
            </View>
          </View>
        </View>

        {/* Clinical Summary */}
        {data.vet_summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo Clínico Profissional</Text>
            <Text style={styles.contentText}>{data.vet_summary}</Text>
          </View>
        )}

        {/* Detailed Medical Record */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prontuário Estruturado</Text>
          {Object.entries(data.structured_content || {}).map(([key, value]) => (
            <View key={key} style={styles.contentBlock}>
              <Text style={styles.contentLabel}>{key}</Text>
              <Text style={styles.contentText}>{String(value)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Gerado via ProntuVet AI • Assistência Veterinária Inteligente</Text>
          <Text style={styles.footerText}>Página 1</Text>
        </View>
      </Page>
    </Document>
  )
}
