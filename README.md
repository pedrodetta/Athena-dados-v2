# Athena Dados V2

MVP de uma aplicacao SaaS para avaliacao imobiliaria, criado em HTML, CSS e JavaScript puro.

## O que esta incluido

- Dashboard com indicadores de valor medio, avaliacoes ativas, laudos e confianca media.
- Fluxo de nova avaliacao com dados do imovel, ajustes tecnicos e comparaveis.
- Calculo de valor estimado por metodo comparativo simplificado.
- Base de imoveis, clientes e relatorios tecnicos.
- Impressao/exportacao do relatorio via dialogo do navegador.
- Persistencia local com `localStorage`.
- Tema claro/escuro e layout responsivo.

## Como rodar

Abra `index.html` diretamente no navegador ou use um servidor local:

```bash
python3 -m http.server 4173
```

Depois acesse:

```text
http://localhost:4173
```

## Proximos passos naturais

- Backend com autenticacao, multiempresa e permissoes por perfil.
- Banco de dados para avaliacoes, clientes, amostras e laudos.
- Integracao com mapas, fontes de anuncios, cartorios e dados publicos.
- Geracao de PDF padronizado com assinatura e anexos.
- Motor de avaliacao com trilha de auditoria e metodos ABNT/NBR aplicaveis.
