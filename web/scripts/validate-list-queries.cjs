/**
 * Validates hand-written list documents in web/core/graphql/lists.ts
 * against aws/schema.graphql. No external dependencies.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '../..')
const schemaPath = path.join(root, 'aws/schema.graphql')
const docFiles = [
  path.join(root, 'web/core/graphql/lists.ts'),
  path.join(root, 'web/core/graphql/jam.ts'),
  path.join(root, 'extension/src/popup/graphql.ts'),
]

const SCALARS = new Set([
  'ID', 'String', 'Int', 'Float', 'Boolean',
  'AWSEmail', 'AWSTimestamp', 'AWSDateTime', 'AWSJSON', 'AWSURL', 'AWSPhone', 'AWSIPAddress',
])

function stripComments(src) {
  return src
    .split('\n')
    .map((line) => line.replace(/#.*$/, ''))
    .join('\n')
}

function stripParens(src) {
  let out = ''
  let depth = 0
  for (const ch of src) {
    if (ch === '(') { depth++; continue }
    if (ch === ')' && depth > 0) { depth--; continue }
    if (depth === 0) out += ch
  }
  return out
}

function unwrap(typeName) {
  let name = typeName.trim()
  while (name.endsWith('!')) name = name.slice(0, -1)
  while (name.startsWith('[') && name.endsWith(']')) name = name.slice(1, -1).trim()
  while (name.endsWith('!')) name = name.slice(0, -1)
  return name
}

function parseSchema(sdl) {
  const src = stripComments(sdl)
  const types = new Map()
  const enums = new Set()
  const re = /\b(type|enum|input)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g
  let match
  while ((match = re.exec(src))) {
    const kind = match[1]
    const name = match[2]
    let i = re.lastIndex
    let depth = 1
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++
      else if (src[i] === '}') depth--
      i++
    }
    const body = src.slice(re.lastIndex, i - 1)
    re.lastIndex = i
    if (kind === 'enum') {
      enums.add(name)
      continue
    }
    const fields = new Map()
    const flat = stripParens(body)
    const fieldRe = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(\[[^\]]+\]!?|[A-Za-z_][A-Za-z0-9_]*!?)/g
    let field
    while ((field = fieldRe.exec(flat))) {
      fields.set(field[1], unwrap(field[2]))
    }
    types.set(name, fields)
  }
  return { types, enums }
}

function parseSelection(src, start) {
  let i = start
  if (src[i] !== '{') throw new Error('expected selection set')
  i++
  const fields = []
  while (i < src.length) {
    while (i < src.length && /[\s,]/.test(src[i])) i++
    if (src[i] === '}') return { fields, index: i + 1 }
    const nameMatch = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))
    if (!nameMatch) throw new Error(`expected field at ${src.slice(i, i + 40)}`)
    const name = nameMatch[0]
    i += name.length
    while (i < src.length && /\s/.test(src[i])) i++
    if (src[i] === '(') {
      let depth = 0
      do {
        if (src[i] === '(') depth++
        else if (src[i] === ')') depth--
        i++
      } while (depth > 0 && i < src.length)
      while (i < src.length && /\s/.test(src[i])) i++
    }
    let children = []
    if (src[i] === '{') {
      const nested = parseSelection(src, i)
      children = nested.fields
      i = nested.index
    }
    fields.push({ name, children })
  }
  throw new Error('unterminated selection set')
}

function extractDocuments(ts) {
  const docs = []
  const re = /\/\* GraphQL \*\/ `([\s\S]*?)`/g
  let match
  while ((match = re.exec(ts))) docs.push(match[1])
  return docs
}

function operationRoot(doc) {
  const trimmed = doc.trim()
  if (trimmed.startsWith('query') || trimmed.startsWith('{')) return 'Query'
  if (trimmed.startsWith('mutation')) return 'Mutation'
  if (trimmed.startsWith('subscription')) return 'Subscription'
  throw new Error(`unknown operation: ${trimmed.slice(0, 40)}`)
}

function validateFields(types, enums, typeName, fields, trail, errors) {
  const typeFields = types.get(typeName)
  if (!typeFields) {
    errors.push(`${trail}: unknown type ${typeName}`)
    return
  }
  for (const field of fields) {
    const next = `${trail}.${field.name}`
    if (!typeFields.has(field.name)) {
      errors.push(`${next}: not a field of ${typeName}`)
      continue
    }
    const named = typeFields.get(field.name)
    const leaf = SCALARS.has(named) || enums.has(named)
    if (leaf && field.children.length > 0) errors.push(`${next}: scalar ${named} cannot have a selection`)
    if (!leaf && field.children.length === 0) errors.push(`${next}: object ${named} needs a selection`)
    if (!leaf) validateFields(types, enums, named, field.children, next, errors)
  }
}

function validateDocument(schema, doc) {
  const errors = []
  const brace = doc.indexOf('{')
  if (brace < 0) {
    errors.push('document has no selection')
    return errors
  }
  let parsed
  try {
    parsed = parseSelection(doc, brace)
  } catch (e) {
    errors.push(e.message)
    return errors
  }
  // The first brace is the operation body. Its fields are root fields.
  validateFields(schema.types, schema.enums, operationRoot(doc), parsed.fields, operationRoot(doc), errors)
  return errors
}

function main() {
  const schema = parseSchema(fs.readFileSync(schemaPath, 'utf8'))
  const required = ['Query', 'Mutation', 'Subscription', 'Song', 'Band', 'SetList', 'JamSession', 'User', 'JamSong', 'Participant', 'DeleteSetResult', 'JamSongChange', 'SpotifySearchResult', 'SpotifyTrack', 'ChordImportRequest']
  for (const name of required) {
    if (!schema.types.has(name)) {
      console.error(`schema is missing type ${name}`)
      process.exit(1)
    }
  }

  const docs = docFiles.flatMap((file) => {
    if (!fs.existsSync(file)) {
      console.error(`missing GraphQL document file ${file}`)
      process.exit(1)
    }
    return extractDocuments(fs.readFileSync(file, 'utf8')).map((doc) => ({ doc, file }))
  })
  if (docs.length === 0) {
    console.error('no GraphQL documents found')
    process.exit(1)
  }

  let failed = false
  docs.forEach(({ doc, file }, index) => {
    const errors = validateDocument(schema, doc)
    const label = `${path.relative(root, file)} ${(doc.trim().split('\n')[0] || `doc ${index}`).trim()}`
    const allowsChordSheet = /\b(getSong|addSongToLiveJam|onJamSongsChanged|setLiveJamChordSheet|completeImport|onImportStatusChanged)\s*\(/.test(doc)
    const selection = stripParens(doc)
    if (!allowsChordSheet) {
      if (/\bchordSheet\b/.test(selection)) errors.push('list document must not request chordSheet')
      if (/\brecordings\b/.test(selection)) errors.push('list document must not request recordings')
      if (/\bsongsCreated\b/.test(selection)) errors.push('list document must not request songsCreated')
      if (/friends\s*\{[^}]*friends/.test(selection)) errors.push('list document must not request nested friends')
    } else if (!/\bchordSheet\b/.test(selection)) {
      errors.push('this document must request chordSheet')
    }
    if (/\bsearchSongs\s*\(/.test(doc) && /\bchordSheet\b/.test(selection)) {
      errors.push('searchSongs must not request chordSheet')
    }
    if (errors.length) {
      failed = true
      console.error(`\n${label}`)
      errors.forEach((err) => console.error(`  - ${err}`))
    } else {
      console.log(`ok ${label}`)
    }
  })

  if (failed) process.exit(1)
  console.log(`validated ${docs.length} documents against ${schemaPath}`)
}

main()
