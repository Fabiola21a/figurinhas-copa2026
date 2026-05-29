# Kit Figurinhas Copa 2026 — Deploy no Vercel

## Arquivos
```
/
├── index.html        ← Página de vendas principal
├── upsell.html       ← Upsell pós-compra (Cartelas de Corte)
├── obrigado.html     ← Página de confirmação final
├── api/
│   ├── create-pix.js ← Cria cobrança Pix no Abacate Pay
│   └── check-pix.js  ← Verifica status do pagamento
└── vercel.json       ← Configuração do Vercel
```

## Passo a passo para subir no Vercel

### 1. Crie sua conta no Abacate Pay
- Acesse: https://abacatepay.com
- Crie sua conta gratuita
- Vá em **Configurações → API Keys**
- Copie sua **API Key**

### 2. Suba no Vercel
- Acesse: https://vercel.com
- Clique em **Add New → Project**
- Arraste esta pasta OU conecte ao GitHub
- Na tela de configuração, vá em **Environment Variables**
- Adicione:
  - **Name:** `ABACATE_API_KEY`
  - **Value:** (cole sua API Key aqui)
- Clique em **Deploy**

### 3. Pronto!
Seu site estará no ar em menos de 1 minuto.

## Fluxo de compra
1. Cliente acessa `index.html`
2. Escolhe os order bumps (Neymar R$4,00 e/ou Gold R$3,50)
3. Clica em "Finalizar Pagamento" → QR Code Pix abre na tela
4. Após pagamento confirmado → vai para `upsell.html`
5. Aceita ou recusa o upsell (Cartelas de Corte R$7,50)
6. Vai para `obrigado.html`

## Preços configurados
- Kit Premium 2026: R$ 24,90
- Order bump Neymar: + R$ 4,00
- Order bump Gold Raras: + R$ 3,50
- Upsell Cartelas de Corte: R$ 7,50

## Custo por venda
- Abacate Pay: R$ 0,80 fixo por transação (independente do valor)
- Vercel: R$ 0,00 (plano gratuito)
