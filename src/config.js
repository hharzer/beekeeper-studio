import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import Encryptor from 'simple-encryptor'
import { remote } from 'electron'
import { execSync } from 'child_process'
import platformInfo from './common/platform_info'

let userDirectory = remote.app.getPath('userData');
if (remote.process.env.PORTABLE_EXECUTABLE_DIR) {
  userDirectory = path.join(remote.process.env.PORTABLE_EXECUTABLE_DIR, 'beekeeper_studio_data')
}

if (remote.process.env.DEBUG) {
  localStorage.debug = remote.process.env.DEBUG
}

const defaultEncryptionKey = "38782F413F442A472D4B6150645367566B59703373367639792442264529482B"
const keyFile = path.join(userDirectory, '.key')

function hasSshKeysPlug() {
  try {
    const code = execSync('snapctl is-connected ssh-keys')
    return code == 0
  } catch (error) {
    return false    
  }
}

function initUserDirectory() {
  if (!fs.existsSync(userDirectory)) {
    fs.mkdirSync(userDirectory, { recursive: true })
  }
}

function loadEncryptionKey() {
  initUserDirectory();
  const encryptor = Encryptor(defaultEncryptionKey)

  if(!fs.existsSync(keyFile)) {
    const generatedKey = crypto.randomBytes(32)
    const newKey = generatedKey.toString('hex')
    const result = {
      'encryptionKey': newKey
    }
    fs.writeFileSync(keyFile, encryptor.encrypt(result), 'UTF8')
    return newKey
  } else {
    const encryptedData = fs.readFileSync(keyFile, 'UTF8')
    const data = encryptor.decrypt(encryptedData)
    return data['encryptionKey']
  }
}

// this is available in vue as `this.$config`
export default {
  ...platformInfo,
  userDirectory,
  encryptionKey: loadEncryptionKey(),
  snapSshPlug: hasSshKeysPlug(),

  defaults: {
    connectionTypes: [
      { name: 'MySQL', value: 'mysql' },
      { name: 'MariaDB', value: 'mariadb'},
      { name: 'Postgres', value: 'postgresql' },
      { name: 'SQLite', value: 'sqlite' },
      { name: 'SQL Server', value: 'sqlserver' },
      { name: 'Amazon Redshift', value: 'redshift' },
      { name: 'CockroachDB', value: 'cockroachdb' }
    ],
  },
  maxResults: 50000
}
