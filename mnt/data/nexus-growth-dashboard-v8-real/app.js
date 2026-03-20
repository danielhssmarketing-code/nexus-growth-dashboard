const dataset = [
  { date: '2026-03-01', channel: 'Google Ads', investment: 2800, revenue: 16400, leads: 49, clients: 14 },
  { date: '2026-03-03', channel: 'Meta Ads', investment: 1900, revenue: 11800, leads: 61, clients: 12 },
  { date: '2026-03-06', channel: 'Google Ads', investment: 3200, revenue: 17600, leads: 55, clients: 16 },
  { date: '2026-03-09', channel: 'Meta Ads', investment: 2200, revenue: 13600, leads: 67, clients: 15 },
  { date: '2026-03-12', channel: 'Google Ads', investment: 3100, revenue: 18100, leads: 52, clients: 17 },
  { date: '2026-03-15', channel: 'Meta Ads', investment: 2400, revenue: 14900, leads: 70, clients: 18 },
  { date: '2026-03-18', channel: 'Google Ads', investment: 3350, revenue: 19200, leads: 58, clients: 19 }
];

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = (n) => `${n.toFixed(1)}%`;
const metaMensal = 180000;

function parseDate(v) { return new Date(v + 'T00:00:00'); }
function sameOrAfter(a, b) { return a.getTime() >= b.getTime(); }
function sameOrBefore(a, b) { return a.getTime() <= b.getTime(); }

const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
startInput.value = '2026-03-01';
endInput.value = '2026-03-20';

document.getElementById('applyRange').addEventListener('click', render);

function filterData() {
  const start = parseDate(startInput.value);
  const end = parseDate(endInput.value);
  return dataset.filter(item => {
    const d = parseDate(item.date);
    return sameOrAfter(d, start) && sameOrBefore(d, end);
  });
}

function renderBars(data) {
  const chart = document.getElementById('barChart');
  chart.innerHTML = '';
  if (!data.length) {
    chart.innerHTML = '<p style="color:#b9bbc2">Nenhum dado encontrado no período selecionado.</p>';
    return;
  }
  const max = Math.max(...data.map(d => Math.max(d.investment, d.revenue)));
  data.forEach(item => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    const investHeight = Math.max(16, (item.investment / max) * 220);
    const revenueHeight = Math.max(16, (item.revenue / max) * 220);
    col.innerHTML = `
      <div class="bar-stack">
        <div class="bar invest" style="height:${investHeight}px"></div>
        <div class="bar revenue" style="height:${revenueHeight}px"></div>
      </div>
      <div class="bar-label">${new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</div>
    `;
    chart.appendChild(col);
  });
}

function renderCampaigns(data) {
  const campaignList = document.getElementById('campaignList');
  const grouped = data.reduce((acc, item) => {
    acc[item.channel] ??= { investment: 0, revenue: 0, leads: 0, clients: 0 };
    acc[item.channel].investment += item.investment;
    acc[item.channel].revenue += item.revenue;
    acc[item.channel].leads += item.leads;
    acc[item.channel].clients += item.clients;
    return acc;
  }, {});
  campaignList.innerHTML = '';
  Object.entries(grouped).forEach(([channel, values]) => {
    const roas = values.investment ? values.revenue / values.investment : 0;
    const row = document.createElement('div');
    row.className = 'campaign-row';
    row.innerHTML = `
      <div>
        <strong>${channel}</strong><br>
        <small style="color:#b9bbc2">${values.leads} leads • ${values.clients} clientes</small>
      </div>
      <div style="text-align:right">
        <strong>${currency.format(values.revenue)}</strong><br>
        <small style="color:#b9bbc2">ROAS ${roas.toFixed(2)}x</small>
      </div>
    `;
    campaignList.appendChild(row);
  });
}

function render() {
  const data = filterData();
  const totals = data.reduce((acc, item) => {
    acc.investment += item.investment;
    acc.revenue += item.revenue;
    acc.leads += item.leads;
    acc.clients += item.clients;
    return acc;
  }, { investment: 0, revenue: 0, leads: 0, clients: 0 });

  const roas = totals.investment ? totals.revenue / totals.investment : 0;
  const roi = totals.investment ? ((totals.revenue - totals.investment) / totals.investment) * 100 : 0;
  const taxaConversao = totals.leads ? (totals.clients / totals.leads) * 100 : 0;
  const cpl = totals.leads ? totals.investment / totals.leads : 0;
  const cpa = totals.clients ? totals.investment / totals.clients : 0;
  const crescimento = 18.4;
  const metaPct = metaMensal ? Math.min((totals.revenue / metaMensal) * 100, 100) : 0;

  document.getElementById('investimentoTotal').textContent = currency.format(totals.investment);
  document.getElementById('faturamentoTotal').textContent = currency.format(totals.revenue);
  document.getElementById('roasTotal').textContent = `${roas.toFixed(2)}x`;
  document.getElementById('roiTotal').textContent = percent(roi);
  document.getElementById('leadsTotal').textContent = totals.leads;
  document.getElementById('clientesTotal').textContent = totals.clients;
  document.getElementById('taxaConversao').textContent = percent(taxaConversao);
  document.getElementById('cplMedio').textContent = currency.format(cpl);
  document.getElementById('cpaMedio').textContent = currency.format(cpa);
  document.getElementById('crescimento').textContent = percent(crescimento);
  document.getElementById('metaMensal').textContent = currency.format(metaMensal);
  document.getElementById('metaRealizada').textContent = currency.format(totals.revenue);
  document.getElementById('metaPercentual').textContent = percent(metaPct);
  document.getElementById('progressFill').style.width = `${metaPct}%`;

  renderBars(data);
  renderCampaigns(data);
}

render();

document.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active-panel'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active-panel');
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.disabled = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.disabled = true;
});
