# Favela • Interactive Showcase

Versão HTML interativa da apresentação `[int] YouTube Fair 2026 - FAVELA _ Interactive Showcase.pptx`, adaptada para **iPad de 10ª geração em orientação horizontal**. Nenhuma dependência de frameworks, bibliotecas externas ou API.

## Publicação na Netlify (sem código)

1. Descompacte o arquivo `.zip` enviado.
2. Acesse https://app.netlify.com/drop ou, no painel Netlify, **Add new project → Deploy manually**.
3. Arraste a **pasta descompactada `favela_interactive_netlify`**, que contém o `index.html`, para a área de publicação.
4. Aguarde a URL HTTPS de publicação.
5. Abra a URL em um iPad com internet, espere **todas as imagens** carregarem no primeiro acesso e faça o teste desligando o Wi-Fi.

**Importante:** se publicar manualmente, envie a pasta **descompactada** (com `index.html` na raiz). Para publicação via Git, o arquivo `netlify.toml` já informa que a pasta raiz é a pasta de publicação.

## Usar como aplicativo offline no iPad

1. No iPad, acesse a URL HTTPS publicada **pelo Safari**.
2. Espere o conteúdo carregar enquanto há internet, incluindo o cache offline do Service Worker.
3. Toque no botão **Compartilhar** → **Adicionar à Tela de Início** (e marque **Abrir como App**, se aparecer).
4. Abra o ícone **Favela** na tela inicial e teste o conteúdo com modo avião.
5. Mantenha o site instalado no iPad e evite limpar os dados do Safari. O iPadOS pode excluir caches; por isso, teste antes de cada evento e mantenha o PDF original como plano de contingência.

> **Para uso offline absolutamente previsível em um evento**, considere instalar os mesmos arquivos HTML em um app de quiosque que aceite páginas locais. A versão PWA depende de manter os arquivos em cache no iPad.

## Navegação

- **Tela 1:** toque em qualquer parte da tela para abrir a seleção de projetos.
- **Tela 2:** selecione um dos três cards para ir a Favela Gaming, Favela Fut ou Expressão Favela.
- **Demais telas:** botões **AVANÇAR**, **VOLTAR**, **VOLTAR AO INÍCIO** e gesto horizontal para mudar de tela.
- **Teclado:** setas para navegar; `Esc` ou `Home` para voltar à seleção.
- **Retorno automático à abertura após 3 minutos de inatividade**, útil em ambiente de estande.

## Arquivos

- `index.html`: estrutura principal.
- `styles.css`: enquadramento e responsividade.
- `app.js`: lógica de navegação, swipe, atalhos e timer de inatividade.
- `slides.js`: lista de páginas, rótulos acessíveis e coordenadas dos botões clicáveis.
- `assets/slides/`: 17 telas em WebP, 2361 × 1641 px.
- `assets/icons/`: ícones do aplicativo.
- `service-worker.js`: pré-cache offline para todas as imagens e arquivos.
- `manifest.webmanifest`: configurações PWA.
- `netlify.toml`: configuração de publicação e cache.

## Editar a experiência

- **Trocar imagem de uma tela:** substitua `assets/slides/tela-XX.webp`, preservando o nome e, preferencialmente, a resolução e proporção.
- **Mudar um botão clicável:** edite, no `slides.js`, a propriedade `actions` da página. `x`, `y`, `w`, `h` são percentuais de posição e tamanho relativos à tela. `go` usa índices começando em **0** (0 = abertura, 1 = menu, 2 = Favela Gaming etc.).
- **Tempo de inatividade:** altere `AUTO_RESET_SECONDS = 180` em `app.js`; use `0` para desativar.
- **Após editar para uma nova publicação:** atualize o valor `CACHE_VERSION` em `service-worker.js` (`v1.0.1`, `v1.0.2` etc.) para solicitar nova cópia offline.

## Limitações importantes

- Para preservar a composição original, as telas são **imagens WebP** sobrepostas por áreas HTML clicáveis. Textos, fotos e elementos gráficos internos **não são objetos HTML separados** e não podem ser editados individualmente no navegador.
- O arquivo PPTX original incorpora algumas fontes não disponíveis no renderizador usado nesta conversão. Foi aplicada **substituição tipográfica para a versão visual**, evitando que títulos invadissem os textos e preservando as fotos, cores e a hierarquia geral. Portanto, a aparência das letras pode diferir do Google Slides original.
- Não há necessidade de internet para as ações de navegação e apresentação **depois que o cache PWA estiver completamente instalado**. A primeira instalação, atualizações e qualquer mídia externa adicionada posteriormente exigem cuidados adicionais.
- Recomendamos usar **Acesso Guiado** nas configurações do iPad para evitar que visitantes saiam acidentalmente do app.