# Edge Contact Gateway

Um microserviço *serverless* construído para atuar como *gateway* de comunicação estrito na borda (Edge Computing) para o formulário de contato da [Hanauer Labs](https://hanauerlabs.com.br).

Desenvolvido com **TypeScript** e executado nativamente no **Cloudflare Workers**, este serviço utiliza o *Cloudflare Email Routing* para processar e encaminhar payloads de contato sem a necessidade de dependências de terceiros (SMTP externo ou APIs como Resend), respeitando o princípio **YAGNI** (*You Aren't Gonna Need It*) e mantendo a complexidade ciclomática no mínimo.

## 🎯 Finalidade e o Problema que Resolve

Sistemas front-end estáticos (como Single Page Applications em Vue/Vite) não podem disparar e-mails nativamente sem expor credenciais no navegador. Soluções convencionais exigem o pagamento de plataformas de terceiros (como Formspree ou Web3Forms) ou a manutenção de um servidor back-end dedicado apenas para atuar como carteiro. 

Este *gateway* resolve isso posicionando-se na borda da rede. Ele recebe a requisição assíncrona do site, valida os dados e utiliza o roteamento nativo da Cloudflare para entregar a mensagem diretamente na caixa de entrada, com custo zero e zero manutenção de infraestrutura.

## 🏗️ Arquitetura e Princípios

* **Zero Dependencies:** Utiliza exclusivamente a API nativa `cloudflare:email`.
* **Boundary Protection:** Isola o front-end estático (Vue/Vite) da lógica de roteamento e envio de e-mails.
* **Strict Mode:** Código tipado com TypeScript Strict, sem uso de ramificações complexas (*Early Return*) e validação estrita de payload na entrada.
* **Edge Performance:** Executado nos nós da Cloudflare (V8 Isolate) para latência mínima e alta disponibilidade.

## 📦 Estrutura do Payload (Request)

O *endpoint* aceita exclusivamente requisições HTTP `POST` com o cabeçalho `Content-Type: application/json`.

O corpo (body) da requisição deve seguir estritamente o contrato abaixo:

```json
{
  "name": "Nome Profissional do Contato",
  "email": "email.corporativo@dominio.com",
  "subject": "Natureza do Desafio (Ex: Arquitetura de Software)",
  "message": "Descrição detalhada do cenário ou necessidade técnica."
}
```

## ⚙️ Pré-requisitos

1. Conta ativa na [Cloudflare](https://dash.cloudflare.com).
2. Um domínio com o **Email Routing** configurado e ativo.
3. `wrangler` CLI instalado localmente (Testado em ambiente Ubuntu 24.04).

## 🚀 Deploy e Configuração de Variáveis via CLI

Este repositório foi desenhado para não versionar dados sensíveis. O roteamento de e-mail requer a injeção de variáveis de ambiente diretamente na infraestrutura da Cloudflare.

Você pode configurar essas variáveis diretamente pelo terminal (CLI) usando o Wrangler antes ou logo após o seu primeiro deploy:

**1. Definir o Destino (Variável Secreta):**
O destino é a sua caixa de entrada real. Para mantê-lo criptografado e seguro, adicione-o como um *Secret*:
```bash
npx wrangler secret put DESTINATION_EMAIL
# O terminal solicitará que você digite o valor. Ex: seu.email.pessoal@gmail.com
npx wrangler secret put SENDER_EMAIL
# Digite o valor. Ex: contato@meu-dominio.com.br
```

**2. Realizar o Deploy:**
```bash
npm install
npx wrangler deploy
```

## 🔐 Configuração e Variáveis de Ambiente (Cloudflare)

Para garantir a integridade e segurança do repositório público, dados sensíveis de roteamento não são versionados no código-fonte ou no `wrangler.toml`. Eles devem ser injetados diretamente no painel da Cloudflare em tempo de execução.

Vá em **Workers & Pages** > `edge-contact-gateway` > **Settings** > **Variables and Secrets** e adicione:

| Variável | Tipo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `DESTINATION_EMAIL` | Plaintext (ou Secret) | `meu-email@gmail.com` | **Obrigatório:** O e-mail de destino real. |
| `SENDER_EMAIL` | Plaintext | `contato@meu-dominio.com.br` | O alias do seu domínio. Será o remetente oficial da mensagem. |

### ⚠️ Regra Estrita do Cloudflare Email Routing

A API `cloudflare:email` **não permite** disparar mensagens diretamente para um endereço de roteamento (Alias/Custom Address). 

O `DESTINATION_EMAIL` configurado nas variáveis de ambiente **deve ser estritamente a caixa de entrada final** (sua conta pessoal do Gmail, Outlook, etc.) que foi previamente verificada e aprovada na aba *Destination addresses* do painel de Email Routing da Cloudflare.

## 💻 Desenvolvimento Local

Para executar o Worker em ambiente local e testar requisições do front-end contornando as políticas de CORS da borda, crie um arquivo `.dev.vars` na raiz do projeto (este arquivo é ignorado pelo Git automaticamente):

```env
DESTINATION_EMAIL="meu-email@gmail.com"
SENDER_EMAIL="contato@meu-dominio.com.br"
```

Inicie o servidor de desenvolvimento:
```bash
npx wrangler dev
```

---
*Construído por [Luiz Hanauer](https://github.com/luizhanauer) sob rígidos padrões de engenharia de software.*