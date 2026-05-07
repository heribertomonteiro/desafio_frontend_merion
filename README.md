# Tela Inicial - Game Slot

Este projeto consiste em uma cena estilo *slot game* construída com PixiJS, organizada em componentes e com foco em estrutura visual, fluxo de interação, organização de código e performance básica.

A aplicação renderiza:
- Um background
- Uma grid de objetos animados distribuídos aleatoriamente
- Um personagem com animações *Idle* e *Win*
- Uma sequência de animações de vitória ( Total Win - Big Win - Mega Win - Super Mega Win ) com *dimmer* (escurecimento do fundo) durante a execução

---

## Stack

- Vite (dev server e build)
- TypeScript
- PixiJS
- Assets em `public/assets`

---

## Como rodar

### Pré-requisitos
- Node.js

### Instalação
```bash
npm install
```

### Ambiente de desenvolvimento
```bash
npm run dev
```

### Build de produção
```bash
npm run build
```

---

## Estrutura do projeto (principais arquivos)

- `src/main.ts`
  - Inicializa o `PIXI.Application`
  - Cria camadas (`backgroundLayer`, `uiLayer`)
  - Carrega todos os assets em paralelo com `Promise.all`
  - Faz o *boot* dos componentes e coordena o fluxo (ex: clique -> sequência de vitória)

- `src/components/ObjectsGrid.ts`
  - Responsável por montar uma grade de objetos animados
  - Carrega sequências (frames) com cache e `Promise.all`
  - Permite ajustes finos por objeto (ex: correção de escala da `Dynamit`)

- `src/components/Character.ts`
  - Personagem como `PIXI.AnimatedSprite`
  - Animações `playIdle()` e `playWin()`
  - Ajuste de escala e velocidade (`setScale`, `setAnimationSpeed`)
  - Volta automaticamente para `Idle` ao final da sequência de vitória

- `src/components/WinAnimation.ts`
  - Gerencia uma sequência ordenada de animações de vitória
  - Cada tipo de win (`BigWin`, `MegaWin`, `SuperWin`, `TotalWin`) é registrado via `setSequences()`
  - `playSequence(upTo, onComplete)` executa as animações em ordem crescente até o nível especificado
  - Troca os frames do `AnimatedSprite` sem recriar o objeto entre as animações
  - Frames corrompidos ou ausentes são ignorados silenciosamente durante o carregamento

- `src/components/Button.ts`
  - Botão com `PIXI.Graphics` e eventos de ponteiro
  - Encapsula o clique via `onClick()`

---

## Fluxo de interação

1. Usuário aciona o SPIN
2. A aplicação:
   - Exibe um dimmer (overlay escuro) atrás da animação
   - Toca a sequência de animações de vitória em ordem crescente:
     `Total Win - Big Win - Mega Win - Super Mega Win `
   - Troca o personagem para a animação de Win, que se mantém durante toda a sequência
3. Ao terminar a sequência completa:
   - Remove o dimmer
   - Remove o sprite da animação
   - O personagem volta automaticamente para o Idle

---

## Performance básica (o que foi pensado)

- Carregamento paralelo de frames com `Promise.all` para reduzir tempo de startup.
- Tolerância a falhas no carregamento: frames corrompidos ou ausentes são ignorados individualmente sem interromper o carregamento dos demais assets.
- Reutilização do `AnimatedSprite`: a troca entre animações de vitória é feita substituindo `sprite.textures` em vez de recriar o objeto, evitando custo desnecessário de adição/remoção no stage.
- Cache de frames por objeto no `ObjectsGrid` para evitar recarregar os mesmos assets.
- Separação em camadas (background vs UI) para manter o controle de ordenação e composição simples.
- O botão SPIN só é adicionado ao stage após o carregamento completo de todos os assets, evitando interações prematuras.

> Observação: em grades grandes (muitos `AnimatedSprite` rodando ao mesmo tempo) o custo de CPU/GPU aumenta. O projeto está preparado para ajustes de densidade (linhas/colunas), velocidade e escala por componente.