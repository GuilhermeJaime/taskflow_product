<div align="center">

# TaskFlow

**Um gestor de tarefas simples, rápido e bonito.**

Aplicação web feita apenas com HTML, CSS e JavaScript, sem frameworks nem build.
Pesquisa, filtros, categorias, modo escuro e dados guardados no próprio browser.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Modo escuro](https://img.shields.io/badge/Modo_escuro-5b5ce2?style=for-the-badge)

[**Ver demonstração**](https://o-teu-utilizador.github.io/taskflow/) ·
[Reportar um problema](https://github.com/o-teu-utilizador/taskflow/issues)

</div>

<!--
  Depois de guardares uma captura de ecrã em docs/preview.png,
  remove as marcas de comentário desta secção:

<p align="center">
  <img src="docs/preview.png" alt="Pré-visualização do TaskFlow" width="900" />
</p>
-->

---

## Sobre o projeto

O TaskFlow é uma interface de gestão de tarefas com um visual limpo, barra lateral, cartões de resumo e uma lista de tarefas com ações rápidas. Foi convertido de um projeto React/Tailwind para JavaScript puro, mantendo o design original e acrescentando várias melhorias.

## Funcionalidades

- **Criar, editar e apagar tarefas**, com título, descrição, data e categoria (Work, Personal, Finance, Health).
- **Anular eliminação**: ao apagar, aparece um aviso com o botão *Undo*.
- **Dados guardados automaticamente** no `localStorage`. As tarefas continuam lá quando voltas à página.
- **Pesquisa em tempo real** por título, descrição ou categoria.
- **Filtros** Todas, Pendentes e Concluídas, com contadores.
- **Vista "Upcoming"**: tarefas pendentes ordenadas pela data mais próxima.
- **Datas inteligentes**: mostra *Today*, *Tomorrow* ou *Sep 28*, e destaca em vermelho as tarefas em atraso.
- **Resumo com progresso**: tarefas por fazer, concluídas e percentagem com barra de progresso.
- **Modo claro e escuro**: segue a preferência do sistema na primeira visita e guarda a tua escolha.
- **Responsivo**: no telemóvel, a barra lateral passa a menu deslizante.
- **Acessível**: foco visível, ARIA, modal com foco preso, menu navegável com setas e respeito por `prefers-reduced-motion`.

### Atalhos de teclado

| Atalho | Ação |
| --- | --- |
| `Ctrl` + `K` (ou `⌘` + `K` no Mac) | Ir para a pesquisa |
| `Esc` | Fechar modal, menu de ações ou menu lateral; limpar a pesquisa |
| `↑` / `↓` | Navegar no menu de ações de uma tarefa |

## Estrutura

```
taskflow/
├── index.html    # Estrutura da página, ícones e modal
├── style.css     # Estilos, temas claro/escuro e responsividade
├── script.js     # Estado, render, pesquisa, filtros, modal e armazenamento
└── README.md
```

## Como executar

Não é preciso instalar nada.

```bash
# 1. Clonar o repositório
git clone https://github.com/o-teu-utilizador/taskflow.git
cd taskflow

# 2. Abrir no browser (ou fazer duplo clique em index.html)
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Se preferires um servidor local:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicar no GitHub Pages

1. Faz *push* do projeto para o GitHub.
2. Vai a **Settings → Pages**.
3. Em **Source**, escolhe **Deploy from a branch**, seleciona a branch `main` e a pasta `/ (root)`.
4. Guarda. Passado um minuto, o site fica disponível em
   `https://o-teu-utilizador.github.io/taskflow/`.

## Personalização

| O que mudar | Onde |
| --- | --- |
| Cor principal e temas | Variáveis `--primary`, `--bg`, `--surface`, etc. em `.app` e `.app.dark` no `style.css` |
| Categorias | `<select name="tag">` em `index.html` e o objeto `TONES` em `script.js` |
| Cores das categorias | Classes `.tag.violet`, `.tag.blue`, `.tag.green`, `.tag.amber` no `style.css` |
| Tarefas de exemplo | Função `seedTasks()` em `script.js` (só aparecem na primeira visita) |

> Para repor as tarefas de exemplo, abre as ferramentas do browser e executa `localStorage.removeItem("taskflow:v1")`, depois recarrega a página.

## Como funciona o armazenamento

Os dados ficam no `localStorage` do teu browser, por isso:

- não são enviados para nenhum servidor;
- não são partilhados entre dispositivos nem entre browsers diferentes;
- desaparecem se limpares os dados do site.

## Próximos passos

- [ ] Sincronizar tarefas com uma API ou base de dados
- [ ] Arrastar e largar para reordenar
- [ ] Subtarefas e prioridades
- [ ] Vários espaços de trabalho
- [ ] Notificações para tarefas em atraso

## Créditos

- Tipografia: [DM Sans](https://fonts.google.com/specimen/DM+Sans), via Google Fonts
- Design original criado no Figma Make e convertido para HTML, CSS e JavaScript

## Licença

Distribuído sob a licença MIT. Consulta o ficheiro `LICENSE` para mais informações.
