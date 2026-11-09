// JP SPORTS — backend central de inscrições (Google Apps Script + Google Sheets)
// Vincule este projeto Apps Script à planilha Google da JP Sports.
const SHEET_NAME = 'Inscritos';
const HEADERS = ['ID','Data','Nome','WhatsApp','E-mail','Distância','Pacote','Tamanho','Valor','Forma de pagamento','Status','Declaração de saúde','Consentimento'];

function doGet() {
  return HtmlService.createHtmlOutput('JP Sports API ativa. Esta página pode ser fechada.');
}

function doPost(e) {
  let req = {};
  try {
    req = JSON.parse((e && e.parameter && e.parameter.payload) || '{}');
    const action = req.action;
    if (action === 'status') return reply_(req.jpRequest, {ok:true, data:{configured:!!PropertiesService.getScriptProperties().getProperty('ADMIN_HASH')}});
    if (action === 'register') return reply_(req.jpRequest, register_(req.registration || {}));
    if (action === 'setup') return reply_(req.jpRequest, setup_(req));
    if (action === 'login') return reply_(req.jpRequest, login_(req.password || ''));
    if (action === 'list') return reply_(req.jpRequest, list_(req.token));
    if (action === 'updateStatus') return reply_(req.jpRequest, updateStatus_(req.token, req.id, req.status));
    return reply_(req.jpRequest, {ok:false, error:'Ação não reconhecida.'});
  } catch (err) {
    return reply_(req.jpRequest, {ok:false, error:String(err && err.message || err)});
  }
}

function register_(r) {
  const required = ['id','full_name','phone','email','distance','package','amount','payment_method'];
  if (required.some(k => !r[k])) throw new Error('Preencha todos os campos obrigatórios.');
  if (r.package === 'with_shirt' && !r.shirt_size) throw new Error('Informe o tamanho da camisa.');
  if (r.consent !== true || r.health_declaration !== true) throw new Error('É necessário aceitar os termos e a declaração de saúde.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();
    sh.appendRow([
      String(r.id), new Date(), clean_(r.full_name,120), clean_(r.phone,30), clean_(r.email,180),
      clean_(r.distance,10), r.package === 'with_shirt' ? 'Com camisa azul' : 'Sem camisa',
      clean_(r.shirt_size || '',8), Number(r.amount), clean_(r.payment_method,40),
      'Pendente', 'Aceita', 'Aceito'
    ]);
  } finally { lock.releaseLock(); }
  return {ok:true, data:{saved:true}};
}

function setup_(req) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('ADMIN_HASH')) throw new Error('A senha administrativa já foi criada. Não é permitido criar outro usuário ou outra senha.');
  const setupCode = props.getProperty('ADMIN_SETUP_CODE');
  if (!setupCode) throw new Error('Configure ADMIN_SETUP_CODE nas propriedades do Apps Script antes de criar a senha.');
  if (String(req.setup_code || '') !== setupCode) throw new Error('Código inicial incorreto.');
  const password = String(req.password || '');
  if (password.length < 10) throw new Error('A senha precisa ter pelo menos 10 caracteres.');
  if (password !== String(req.confirm || '')) throw new Error('As senhas não conferem.');
  props.setProperty('ADMIN_HASH', hash_(password));
  props.deleteProperty('ADMIN_SETUP_CODE'); // setup code de uso único
  return {ok:true, data:{token:issueToken_()}};
}

function login_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_HASH');
  if (!expected) throw new Error('O administrador ainda não foi configurado. Faça a configuração inicial.');
  if (hash_(password) !== expected) throw new Error('Senha incorreta.');
  return {ok:true, data:{token:issueToken_()}};
}

function list_(token) {
  requireToken_(token);
  const sh = sheet_(), values = sh.getDataRange().getValues();
  const rows = values.slice(1).filter(r => r[0]).map(r => ({
    id:String(r[0]), created_at:r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : String(r[1]),
    full_name:String(r[2]), phone:String(r[3]), email:String(r[4]), distance:String(r[5]),
    package_label:String(r[6]), shirt_size:String(r[7]), amount:Number(r[8]), payment_method:String(r[9]),
    status:String(r[10]), health_declaration:String(r[11]), consent:String(r[12])
  })).reverse();
  return {ok:true, data:{rows:rows}};
}

function updateStatus_(token, id, status) {
  requireToken_(token);
  if (!['Pendente','Pago','Cancelado'].includes(status)) throw new Error('Status inválido.');
  const sh = sheet_(), values = sh.getDataRange().getValues();
  for (let i=1; i<values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sh.getRange(i+1, 11).setValue(status);
      return {ok:true, data:{updated:true}};
    }
  }
  throw new Error('Inscrição não encontrada.');
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Planilha não vinculada. Abra Extensões > Apps Script dentro da planilha.');
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}
function clean_(v, max) { return String(v || '').trim().slice(0,max); }
function hash_(v) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v), Utilities.Charset.UTF_8)
    .map(b => (b + 256).toString(16).slice(-2)).join('');
}
function issueToken_() {
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('jp_admin_' + token, '1', 21600);
  return token;
}
function requireToken_(token) {
  if (!token || CacheService.getScriptCache().get('jp_admin_' + token) !== '1') throw new Error('Sessão expirada. Entre novamente.');
}
function reply_(requestId, result) {
  const payload = JSON.stringify({jpRequest:requestId, ok:!!result.ok, data:result.data || null, error:result.error || ''}).replace(/</g,'\\u003c');
  const html = '<!doctype html><html><body><script>window.parent.postMessage(' + payload + ', "*");</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
