import React from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../src/theme'

export function Screen({
  title,
  subtitle,
  onBack,
  action,
  children,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return <View style={{ flex: 1, paddingTop: insets.top }}>
    <View style={styles.header}>
      {onBack ? <Pressable onPress={onBack} style={styles.back}><Text style={{ color: colors.accent, fontWeight: '700' }}>Back</Text></Pressable> : <View style={styles.back} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.muted, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
    {children}
  </View>
}

export function Body({ children, onRefresh }: { children: React.ReactNode, onRefresh?: React.ReactNode }) {
  return <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
    {onRefresh}
    {children}
  </ScrollView>
}

export function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>{children}</View>
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoCapitalize,
  secureTextEntry,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  multiline?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words'
  secureTextEntry?: boolean
}) {
  const { colors } = useTheme()
  return <View style={{ marginBottom: 12 }}>
    <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      autoCapitalize={autoCapitalize || 'sentences'}
      autoCorrect={autoCapitalize === 'none' ? false : undefined}
      secureTextEntry={secureTextEntry}
      style={[styles.input, {
        color: colors.text,
        backgroundColor: colors.input,
        borderColor: colors.line,
        minHeight: multiline ? 160 : 44,
        textAlignVertical: multiline ? 'top' : 'center',
      }]}
    />
  </View>
}

export function Btn({
  label,
  onPress,
  busy,
  tone,
  disabled,
}: {
  label: string
  onPress: () => void
  busy?: boolean
  tone?: 'accent' | 'danger' | 'plain'
  disabled?: boolean
}) {
  const { colors } = useTheme()
  const background = tone === 'danger' ? colors.danger : tone === 'plain' ? colors.card : colors.accent
  const color = tone === 'plain' ? colors.text : colors.accentText
  return <Pressable onPress={onPress} disabled={disabled || busy} style={[styles.btn, { backgroundColor: background, borderColor: colors.line, opacity: disabled ? 0.5 : 1 }]}>
    {busy ? <ActivityIndicator color={color} /> : <Text style={{ color, fontWeight: '700' }}>{label}</Text>}
  </Pressable>
}

export function Row({ title, detail, onPress, meta }: { title: string, detail?: string, meta?: string, onPress?: () => void }) {
  const { colors } = useTheme()
  return <Pressable onPress={onPress} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>{title}</Text>
      {detail ? <Text style={{ color: colors.muted, marginTop: 2 }} numberOfLines={1}>{detail}</Text> : null}
    </View>
    {meta ? <Text style={{ color: colors.muted, marginLeft: 8 }}>{meta}</Text> : null}
  </Pressable>
}

export function Notice({ text, tone }: { text: string, tone?: 'error' }) {
  const { colors } = useTheme()
  if (!text) return null
  return <Text style={{ color: tone === 'error' ? colors.danger : colors.muted, marginBottom: 10 }}>{text}</Text>
}

export function Empty({ title, body }: { title: string, body?: string }) {
  const { colors } = useTheme()
  return <View style={{ paddingVertical: 18 }}>
    <Text style={{ color: colors.text, fontWeight: '700' }}>{title}</Text>
    {body ? <Text style={{ color: colors.muted, marginTop: 4 }}>{body}</Text> : null}
  </View>
}

export function Keys({ value, onChange }: { value: string, onChange: (key: string) => void }) {
  const { colors } = useTheme()
  const keys = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
    {keys.map((key) => {
      const selected = key === value
      return <Pressable key={key} onPress={() => onChange(key)} style={[styles.chip, { backgroundColor: selected ? colors.accent : colors.chip }]}>
        <Text style={{ color: selected ? colors.accentText : colors.text, fontWeight: '700' }}>{key}</Text>
      </Pressable>
    })}
  </ScrollView>
}

export function NeedAccount({ onSignIn }: { onSignIn: () => void }) {
  return <Screen title="Sign in">
    <Body>
      <Empty title="Sign in to use this." body="Songs, sets, bands, and your private jam rooms follow the account you use on tabs.oslyn.io." />
      <Btn label="Sign in" onPress={onSignIn} />
    </Body>
  </Screen>
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  back: { width: 52, paddingVertical: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 120 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  btn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
})
