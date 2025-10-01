# deapdi

## Componente `Modal`

O componente `Modal` agora oferece uma experiência de acessibilidade aprimorada, mantendo a API visual existente.

### Uso básico

```tsx
import { Modal } from '@/components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Detalhes"
  ariaLabelledby="modal-detalhes-titulo"
  ariaDescribedby="modal-detalhes-conteudo"
>
  <p>
    Conteúdo do modal com informações adicionais.
  </p>
</Modal>;
```

### Acessibilidade

- A janela modal recebe automaticamente `role="dialog"` e `aria-modal="true"`.
- Foco inicial é direcionado para o contêiner do modal quando aberto e retorna ao elemento previamente focado ao fechar.
- A tecla `Esc` fecha o modal, facilitando a navegação pelo teclado.
- As novas props opcionais `ariaLabelledby` e `ariaDescribedby` permitem conectar o título e o conteúdo do modal aos atributos ARIA correspondentes (o corpo do modal recebe automaticamente o `id` informado em `ariaDescribedby`).

### Testes com leitores de tela

1. **NVDA (Windows)**
   - Abra o modal e confirme que o leitor anuncia o título e a descrição configurados.
   - Verifique se o foco inicial é aplicado ao modal e se a tecla `Esc` encerra o diálogo.
2. **VoiceOver (macOS)**
   - Abra o modal utilizando o VoiceOver e confirme a leitura do título e do conteúdo descritivo.
   - Assegure-se de que a navegação por teclado e o fechamento com `Esc` funcionam corretamente.

Registre qualquer ajuste adicional necessário após os testes para manter a acessibilidade alinhada com NVDA e VoiceOver.
