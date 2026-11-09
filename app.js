(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('registration-form'), packageSelect = $('package'), sizeWrap = $('shirt-size-wrap'), sizeSelect = $('shirt_size');
  const prices = {no_shirt:59.90, with_shirt:99.90};
  const whatsappNumber = '5581999510223', pixKey = '52.244.653/0001-10';
  let token = '', rows = [];
  const money = n => Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const packageName = k => k === 'with_shirt' ? 'Com camisa azul' : 'Sem camisa';
  const endpoint = window.JP_CONFIG && window.JP_CONFIG.GOOGLE_SCRIPT_URL || '';
  const apiForm = $('api-form'), frame = $('jp-api-frame');

  function api(payload) {
    return new Promise((resolve,reject) => {
      if (!endpoint.startsWith('https://script.google.com/macros/s/') || !endpoint.endsWith('/exec')) {
        reject(new Error('Falta configurar a URL /exec do Google Apps Script no config.js.'));
        return;
      }
      const id = 'jp_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      let done = false;
      const finish = (fn,value) => { if(done)return; done=true; window.removeEventListener('message',listener); clearTimeout(timer); fn(value); };
      const listener = e => {
        if (e.source !== frame.contentWindow || !e.data || e.data.jpRequest !== id) return;
        if (e.data.ok) finish(resolve,e.data.data || {});
        else finish(reject,new Error(e.data.error || 'Não foi possível concluir a operação.'));
      };
      window.addEventListener('message',listener);
      apiForm.action = endpoint;
      apiForm.elements.payload.value = JSON.stringify({...payload,jpRequest:id});
      const timer = setTimeout(() => finish(reject,new Error('Tempo esgotado. Verifique se o Apps Script foi implantado como Aplicativo da web acessível a qualquer pessoa.')),25000);
      apiForm.submit();
    });
  }

  function updatePrice() {
    const hasShirt = packageSelect.value === 'with_shirt';
    sizeWrap.classList.toggle('hidden',!hasShirt);
    sizeSelect.required = hasShirt;
    $('total').textContent = prices[packageSelect.value] ? money(prices[packageSelect.value]) : 'Selecione seu pacote';
  }
  packageSelect.addEventListener('change',updatePrice); updatePrice();

  function showPublic() { $('admin-view').classList.add('hidden'); $('public-view').classList.remove('hidden'); }
  async function showAdmin() {
    $('public-view').classList.add('hidden'); $('admin-view').classList.remove('hidden');
    $('admin-auth-card').classList.remove('hidden'); $('admin-dashboard').classList.add('hidden');
    $('login-message').textContent = 'Verificando configuração...';
    try {
      const status = await api({action:'status'});
      const configured = !!status.configured;
      $('setup-code-label').classList.toggle('hidden',configured);
      $('new-password-label').classList.toggle('hidden',configured);
      $('confirm-password-label').classList.toggle('hidden',configured);
      $('current-password-label').classList.toggle('hidden',!configured);
      $('setup-code').disabled = configured; $('setup-code').required = !configured;
      $('new-password').disabled = configured; $('new-password').required = !configured;
      $('confirm-password').disabled = configured; $('confirm-password').required = !configured;
      $('admin-password').disabled = !configured; $('admin-password').required = configured;
      $('auth-title').textContent = configured ? 'Acesso administrativo' : 'Criar senha única do administrador';
      $('auth-description').textContent = configured
        ? 'Acesso exclusivo. A senha administrativa já foi criada e não há cadastro de novos usuários.'
        : 'Primeira configuração: crie a única senha administrativa usando o código inicial do Apps Script.';
      $('auth-submit').textContent = configured ? 'Entrar' : 'Criar senha e acessar';
      $('login-message').textContent = '';
    } catch(err) {
      $('login-message').textContent = err.message;
    }
  }
  $('admin-open').addEventListener('click',()=>{history.replaceState(null,'',location.pathname+location.search+'#admin');showAdmin();});
  $('back-public').addEventListener('click',()=>{history.replaceState(null,'',location.pathname+location.search);showPublic();});
  if(location.hash==='#admin'||new URLSearchParams(location.search).has('admin')) showAdmin();

  $('admin-auth-form').addEventListener('submit',async e=>{
    e.preventDefault(); const msg=$('login-message'), isSetup=!$('setup-code-label').classList.contains('hidden');
    msg.textContent=isSetup?'Criando senha única...':'Verificando acesso...';
    try {
      let result;
      if(isSetup) {
        const password=$('new-password').value, confirm=$('confirm-password').value;
        if(password.length<10) throw new Error('A senha precisa ter pelo menos 10 caracteres.');
        if(password!==confirm) throw new Error('As senhas não conferem.');
        result=await api({action:'setup',setup_code:$('setup-code').value,password,confirm});
      } else {
        result=await api({action:'login',password:$('admin-password').value});
      }
      token=result.token;
      $('admin-auth-card').classList.add('hidden'); $('admin-dashboard').classList.remove('hidden');
      await loadRows();
    } catch(err) { msg.textContent=err.message; }
  });

  function renderRows() {
    $('stat-total').textContent=rows.length;
    $('stat-3k').textContent=rows.filter(r=>r.distance==='3 km').length;
    $('stat-5k').textContent=rows.filter(r=>r.distance==='5 km').length;
    $('stat-shirts').textContent=rows.filter(r=>r.package_label==='Com camisa azul').length;
    $('empty-list').classList.toggle('hidden',rows.length>0);
    const body=$('registrations-body'); body.replaceChildren();
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      const values=[r.created_at,r.full_name,r.phone,r.distance,r.package_label+(r.shirt_size?' ('+r.shirt_size+')':''),money(r.amount),r.payment_method];
      values.forEach(v=>{const td=document.createElement('td');td.textContent=v??'';tr.appendChild(td);});
      const statusTd=document.createElement('td'), select=document.createElement('select');
      ['Pendente','Pago','Cancelado'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;select.appendChild(o);});
      select.value=r.status||'Pendente';
      select.addEventListener('change',async()=>{
        select.disabled=true;
        try { await api({action:'updateStatus',token,id:r.id,status:select.value}); r.status=select.value; }
        catch(err){alert(err.message);select.value=r.status||'Pendente';}
        finally{select.disabled=false;}
      });
      statusTd.appendChild(select);tr.appendChild(statusTd);body.appendChild(tr);
    });
  }
  async function loadRows() {
    $('empty-list').textContent='Carregando inscrições...';
    try { const result=await api({action:'list',token}); rows=result.rows||[]; renderRows(); }
    catch(err){$('login-message').textContent=err.message; $('admin-dashboard').classList.add('hidden'); $('admin-auth-card').classList.remove('hidden');}
  }
  $('refresh-list').addEventListener('click',loadRows);
  $('admin-logout').addEventListener('click',()=>{token='';rows=[];$('admin-dashboard').classList.add('hidden');$('admin-auth-card').classList.remove('hidden');$('admin-auth-form').reset();showAdmin();});
  $('export-csv').addEventListener('click',()=>{
    if(!rows.length){alert('Não há inscrições para exportar.');return;}
    const headers=['Data','Nome','WhatsApp','E-mail','Distância','Pacote','Tamanho','Valor','Forma de pagamento','Status','Declaração de saúde','Consentimento'];
    const data=rows.map(r=>[r.created_at,r.full_name,r.phone,r.email,r.distance,r.package_label,r.shirt_size,money(r.amount),r.payment_method,r.status,r.health_declaration,r.consent]);
    const csv=[headers,...data].map(line=>line.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    a.href=url;a.download='inscritos-jp-sports.csv';a.click();URL.revokeObjectURL(url);
  });

  form.addEventListener('submit',async e=>{
    e.preventDefault(); if(!form.reportValidity())return;
    const d=Object.fromEntries(new FormData(form));
    const registration={
      id:Date.now()+'-'+Math.random().toString(36).slice(2,10),
      full_name:String(d.full_name).trim(),phone:String(d.phone).trim(),email:String(d.email).trim(),
      distance:d.distance,package:d.package,shirt_size:d.package==='with_shirt'?d.shirt_size:'',
      amount:prices[d.package],payment_method:d.payment_method||'Pix',
      consent:d.consent==='on',health_declaration:d.health_declaration==='on'
    };
    const btn=$('submit-btn'),msg=$('form-message');
    const waText=[
      'Olá! Quero solicitar minha inscrição no Treinão Novembro Azul do JP.','',
      'Nome: '+registration.full_name,'WhatsApp: '+registration.phone,'E-mail: '+registration.email,
      'Distância: '+registration.distance,'Pacote: '+packageName(registration.package),
      ...(registration.shirt_size?['Tamanho da camisa: '+registration.shirt_size]:[]),
      'Valor: '+money(registration.amount),'Forma de pagamento: '+registration.payment_method,
      ...(registration.payment_method==='Pix'?['Chave Pix (CNPJ): '+pixKey]:['Solicito orientações para pagamento com cartão de crédito.']),
      'Declaração de saúde: aceita.','Consentimento de uso de dados: aceito.'
    ].join('\n');
    const waUrl='https://wa.me/'+whatsappNumber+'?text='+encodeURIComponent(waText);
    const waWindow=window.open('about:blank','_blank');
    btn.disabled=true;btn.textContent='Registrando inscrição...';msg.textContent='';
    try {
      await api({action:'register',registration});
      msg.textContent='Inscrição registrada! O WhatsApp será aberto para você enviar a mensagem à organização.';
      msg.className='success';
      if(waWindow){waWindow.location.href=waUrl;}else{msg.textContent+=' Pop-up bloqueado: permita pop-ups para abrir o WhatsApp.';}
      form.reset();updatePrice();
    } catch(err) {
      if(waWindow)waWindow.close();
      msg.textContent=err.message;msg.className='error';
    } finally {btn.disabled=false;btn.textContent='Confirmar solicitação pelo WhatsApp';}
  });
})();
