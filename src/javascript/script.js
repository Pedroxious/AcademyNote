const addButtons = document.querySelectorAll(".add-card");
const popup = document.querySelector(".popup-overlay");
const cancelBtn = document.getElementById("cancel");
const saveBtn = document.getElementById("save");
const userSelect = document.getElementById("task-user");
const emojiPicker = document.querySelector('.emoji-picker');
const closeEmojiBtn = document.querySelector('.close-emoji');
const floatingBtn = document.querySelector('.floating-btn');
const themeToggle = document.getElementById('theme-toggle');

let currentColumn = null;
let currentCardForReaction = null;
let messageInterval = null;
let isDarkMode = false;

// Dados dos usuários
const users = {
  'profile1.jpg': 'Helena Martins',
  'profile2.jpg': 'Camila Souza', 
  'profile3.jpg': 'Laura Ferreira',
  'profile4.jpg': 'Juliana Costa',
  'profile5.jpg': 'Mariana Silva',
  'profile6.jpg': 'Lucas Almeida',
  'profile7.jpg': 'Rafael Santos',
  'profile8.jpg': 'Pedro Lima'
};

// Mensagens pré-definidas para simular conversas
const predefinedMessages = [
  { user: 'profile7.jpg', text: 'Pessoal, atualizei o status da task no dashboard. Quem puder revisar?', delay: 5000 },
  { user: 'profile4.jpg', text: 'Acabei de testar e está funcionando perfeitamente!', delay: 10000 },
  { user: 'profile1.jpg', text: 'Vou dar uma olhada agora no código.', delay: 15000 },
  { user: 'profile5.jpg', text: 'Alguém pode me ajudar com a API de login?', delay: 25000 },
  { user: 'profile3.jpg', text: 'Claro! Me chama no privado que te ajudo.', delay: 35000 },
  { user: 'profile8.jpg', text: 'Finalmente consegui resolver o bug de mobile! 🎉', delay: 40000 },
  { user: 'profile6.jpg', text: 'Ótimo trabalho, Pedro! Agora podemos focar nas novas features.', delay: 45000 }, // <-- VÍRGULA ADICIONADA AQUI
  { user: 'profile7.jpg', text: 'Tá bom', delay: 50000 },
  { user: 'profile4.jpg', text: 'Oi, time!', delay: 55000 },
  { user: 'profile1.jpg', text: 'Preciso de ajuda com essa tarefa', delay: 60000 },
  { user: 'profile5.jpg', text: 'Vou estar offline na parte da noite, vou pedir para o carlos cobrir por mim', delay: 65000 },
  { user: 'profile3.jpg', text: 'Já tentei de tudo e não funciona', delay: 70000 },
  { user: 'profile8.jpg', text: 'Ok', delay: 80000 },
  { user: 'profile6.jpg', text: 'Preciso de mais um dia pra finalizar, blz?', delay: 85000 }
];

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Verificar preferência de tema salva
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    enableDarkMode();
  }
  
  updateSelectedUserImage();
  setupEventListeners();
  startMessageSimulation();
  updateColumnCounts();
  adjustLayout();
  
  // Ajustar layout quando a janela for redimensionada
  window.addEventListener('resize', adjustLayout);
}

// Ajustar layout para evitar scroll horizontal
function adjustLayout() {
  const kanban = document.querySelector('.kanban');
  const columns = document.querySelectorAll('.kanban-column');
  
  // Se houver scroll horizontal, ajustar as colunas
  if (kanban.scrollWidth > kanban.clientWidth) {
    columns.forEach(column => {
      column.style.minWidth = '300px';
      column.style.maxWidth = '100%';
    });
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Alternar tema
  themeToggle.addEventListener('click', toggleTheme);
  
  // Abrir popup
  addButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      popup.classList.remove("hidden");
      currentColumn = btn.closest(".kanban-column").querySelector(".kanban-cards");
      updateSelectedUserImage();
    });
  });

  // Botão flutuante
  floatingBtn.addEventListener('click', () => {
    // Abre o popup na primeira coluna (Pendentes)
    const firstColumn = document.querySelector('.kanban-column[data-id="1"]');
    const addButton = firstColumn.querySelector('.add-card');
    addButton.click();
  });

  // Evento para atualizar a imagem quando o usuário muda a seleção
  userSelect.addEventListener('change', updateSelectedUserImage);

  // Fechar popup ao clicar fora
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      closePopup();
    }
  });

  // Cancelar popup
  cancelBtn.addEventListener("click", closePopup);

  // Salvar nova tarefa
  saveBtn.addEventListener("click", saveTask);

  // Picker de emojis
  closeEmojiBtn.addEventListener('click', () => {
    emojiPicker.classList.add('hidden');
  });

  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', handleEmojiReaction);
  });

  // Fechar emoji picker ao clicar fora
  document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && !e.target.closest('.reaction-btn') && !emojiPicker.classList.contains('hidden')) {
      emojiPicker.classList.add('hidden');
    }
  });

  // Tecla ESC para fechar o popup e emoji picker
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!popup.classList.contains('hidden')) {
        closePopup();
      }
      if (!emojiPicker.classList.contains('hidden')) {
        emojiPicker.classList.add('hidden');
      }
    }
  });

  // Tecla Enter para salvar no popup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !popup.classList.contains('hidden')) {
      e.preventDefault();
      saveBtn.click();
    }
  });

  // Aplicar eventos de drag a todos os cards existentes
  document.querySelectorAll(".kanban-card").forEach(card => {
    addDragEvents(card);
    setupCardInteractions(card);
  });

  // Configurar eventos de drag para as colunas
  document.querySelectorAll(".kanban-cards").forEach(column => {
    setupColumnDragEvents(column);
  });
}

// Alternar entre modo claro e escuro
function toggleTheme() {
  if (isDarkMode) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

// Ativar modo escuro
function enableDarkMode() {
  document.body.classList.add('dark-mode');
  isDarkMode = true;
  themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  localStorage.setItem('theme', 'dark');
}

// Desativar modo escuro
function disableDarkMode() {
  document.body.classList.remove('dark-mode');
  isDarkMode = false;
  themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
  localStorage.setItem('theme', 'light');
}

// Atualizar imagem do usuário selecionado
function updateSelectedUserImage() {
  const selectedOption = userSelect.options[userSelect.selectedIndex];
  const imgUrl = selectedOption.getAttribute('data-img');
  
  const style = document.createElement('style');
  style.innerHTML = `
    .custom-select::before {
      background-image: url(${imgUrl});
    }
  `;
  
  const existingStyle = document.getElementById('dynamic-select-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  style.id = 'dynamic-select-style';
  document.head.appendChild(style);
}

// Função para fechar o popup
function closePopup() {
  popup.classList.add("hidden");
  clearPopup();
}

// Salvar nova tarefa
function saveTask() {
  const title = document.getElementById("task-title").value;
  const desc = document.getElementById("task-desc").value;
  const priority = document.getElementById("task-priority").value;
  const deadline = document.getElementById("task-deadline").value;
  const tags = document.getElementById("task-tags").value;
  const user = document.getElementById("task-user").value;

  if (title.trim() === "") {
    const titleInput = document.getElementById("task-title");
    titleInput.style.borderColor = '#ff4757';
    titleInput.focus();
    
    setTimeout(() => {
      titleInput.style.borderColor = '';
    }, 1000);
    
    return;
  }

  const card = document.createElement("div");
  const cardId = Date.now();
  card.classList.add("kanban-card");
  card.setAttribute("draggable", "true");
  card.setAttribute("data-id", cardId);

  // Formatar a data se existir
  let deadlineText = "Sem prazo";
  if (deadline) {
    const deadlineDate = new Date(deadline);
    deadlineText = formatDeadline(deadlineDate);
  }

  // Processar tags
  let tagsHTML = '';
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    tagsHTML = tagArray.map(tag => `<span class="tag">${tag}</span>`).join('');
  }

  card.innerHTML = `
    <div class="card-header">
      <span class="priority ${priority}">${getPriorityText(priority)}</span>
      <span class="deadline">${deadlineText}</span>
    </div>
    <h3>${title}</h3>
    <p>${processMentions(desc)}</p>
    <div class="card-tags">
      ${tagsHTML}
    </div>
    <div class="card-footer">
      <div class="user-info">
        <img src="src/images/${user}" alt="User">
        <span>${users[user]}</span>
      </div>
      <div class="reactions">
        <span class="reaction-count">0</span>
        <button class="reaction-btn" data-card="${cardId}"><i class="fa-regular fa-heart"></i></button>
      </div>
    </div>
    
    <div class="comments-section">
      <div class="add-comment">
        <img src="src/images/profile2.jpg" alt="Seu perfil">
        <div class="comment-input">
          <input type="text" placeholder="Adicione um comentário...">
          <button class="post-comment">Publicar</button>
        </div>
      </div>
    </div>
  `;

  addDragEvents(card);
  setupCardInteractions(card);
  currentColumn.appendChild(card);
  
  // Animação de entrada do novo card
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 10);

  // Atualizar contador da coluna
  updateColumnCounts();
  
  closePopup();
}

function getPriorityText(priority) {
  const priorityMap = {
    'high': 'Alta Prioridade',
    'medium': 'Média Prioridade',
    'low': 'Baixa Prioridade'
  };
  return priorityMap[priority] || 'Prioridade';
}

function formatDeadline(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Vence hoje";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Vence amanhã";
  } else {
    const diffTime = Math.abs(date - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `Vence em ${diffDays} dias`;
  }
}

// Processar menções no texto
function processMentions(text) {
  return text.replace(/@(\w+\s\w+)/g, '<span class="mention">@$1</span>');
}

// Limpar campos do popup
function clearPopup() {
  document.getElementById("task-title").value = "";
  document.getElementById("task-desc").value = "";
  document.getElementById("task-priority").value = "high";
  document.getElementById("task-deadline").value = "";
  document.getElementById("task-tags").value = "";
  userSelect.value = "profile1.jpg";
  updateSelectedUserImage();
}

// Atualizar contadores das colunas
function updateColumnCounts() {
  document.querySelectorAll('.kanban-column').forEach(column => {
    const count = column.querySelectorAll('.kanban-card').length;
    const countElement = column.querySelector('.column-count');
    if (countElement) {
      countElement.textContent = count;
    }
  });
}

// Configurar interações dos cards
function setupCardInteractions(card) {
  const reactionBtn = card.querySelector('.reaction-btn');
  const postCommentBtn = card.querySelector('.post-comment');
  const commentInput = card.querySelector('.comment-input input');
  const likeCommentBtns = card.querySelectorAll('.like-comment');
  const replyBtns = card.querySelectorAll('.reply-btn');
  
  // Reações
  if (reactionBtn) {
    reactionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentCardForReaction = card;
      emojiPicker.classList.remove('hidden');
    });
  }
  
  // Comentários
  if (postCommentBtn && commentInput) {
    postCommentBtn.addEventListener('click', () => {
      addComment(card, commentInput.value);
      commentInput.value = '';
    });
    
    commentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addComment(card, commentInput.value);
        commentInput.value = '';
      }
    });
  }
  
  // Curtir comentários
  likeCommentBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      toggleCommentLike(this);
    });
  });
  
  // Responder comentários
  replyBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const comment = this.closest('.comment');
      const author = comment.querySelector('strong').textContent;
      const commentInput = card.querySelector('.comment-input input');
      if (commentInput) {
        commentInput.value = `@${author} `;
        commentInput.focus();
      }
    });
  });
  
  // Menções clicáveis
  card.querySelectorAll('.mention').forEach(mention => {
    mention.addEventListener('click', function() {
      const commentInput = card.querySelector('.comment-input input');
      if (commentInput) {
        commentInput.value = `${this.textContent} `;
        commentInput.focus();
      }
    });
  });
}

// Adicionar comentário
function addComment(card, text) {
  if (!text.trim()) return;
  
  const commentsSection = card.querySelector('.comments-section');
  const addCommentDiv = card.querySelector('.add-comment');
  
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';
  commentDiv.innerHTML = `
    <img src="src/images/profile2.jpg" alt="Você">
    <div class="comment-content">
      <strong>Você</strong>
      <p>${processMentions(text)}</p>
      <div class="comment-actions">
        <span>Agora</span>
        <button class="like-comment"><i class="fa-regular fa-heart"></i> 0</button>
        <button class="reply-btn">Responder</button>
      </div>
    </div>
  `;
  
  commentsSection.insertBefore(commentDiv, addCommentDiv);
  
  // Configurar interações do novo comentário
  const likeBtn = commentDiv.querySelector('.like-comment');
  const replyBtn = commentDiv.querySelector('.reply-btn');
  
  likeBtn.addEventListener('click', function() {
    toggleCommentLike(this);
  });
  
  replyBtn.addEventListener('click', function() {
    const author = commentDiv.querySelector('strong').textContent;
    const commentInput = card.querySelector('.comment-input input');
    if (commentInput) {
      commentInput.value = `@${author} `;
      commentInput.focus();
    }
  });
  
  // Menções clicáveis no novo comentário
  commentDiv.querySelectorAll('.mention').forEach(mention => {
    mention.addEventListener('click', function() {
      const commentInput = card.querySelector('.comment-input input');
      if (commentInput) {
        commentInput.value = `${this.textContent} `;
        commentInput.focus();
      }
    });
  });
}

function toggleCommentLike(button) {
  button.classList.toggle('active');
  const icon = button.querySelector('i');
  const count = parseInt(button.textContent.match(/\d+/) || 0);
  
  if (button.classList.contains('active')) {
    icon.className = 'fa-solid fa-heart';
    button.innerHTML = `<i class="fa-solid fa-heart"></i> ${count + 1}`;
  } else {
    icon.className = 'fa-regular fa-heart';
    button.innerHTML = `<i class="fa-regular fa-heart"></i> ${count - 1}`;
  }
}

// Handler para reações de emoji
function handleEmojiReaction() {
  if (!currentCardForReaction) return;
  
  const emoji = this.getAttribute('data-emoji');
  const reactionBtn = currentCardForReaction.querySelector('.reaction-btn');
  const reactionCount = currentCardForReaction.querySelector('.reaction-count');
  
  // Adicionar reação
  let count = parseInt(reactionCount.textContent);
  reactionCount.textContent = count + 1;
  
  // Animação de reação
  const reactionBubble = document.createElement('div');
  reactionBubble.className = 'reaction-bubble';
  reactionBubble.textContent = emoji;
  reactionBubble.style.position = 'absolute';
  reactionBubble.style.bottom = '60px';
  reactionBubble.style.right = '10px';
  
  currentCardForReaction.appendChild(reactionBubble);
  
  // Animação
  setTimeout(() => {
    reactionBubble.style.transition = 'all 0.5s ease';
    reactionBubble.style.transform = 'translateY(-30px)';
    reactionBubble.style.opacity = '0';
  }, 100);
  
  setTimeout(() => {
    reactionBubble.remove();
  }, 600);
  
  emojiPicker.classList.add('hidden');
}

// Drag & Drop
function addDragEvents(card) {
  card.addEventListener("dragstart", (e) => {
    card.classList.add("dragging");
    e.dataTransfer.setData('text/plain', card.outerHTML);
    e.dataTransfer.effectAllowed = 'move';
    
    setTimeout(() => {
      card.style.opacity = '0.4';
    }, 0);
  });
  
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    card.style.opacity = '1';
    
    document.querySelectorAll('.kanban-cards').forEach(column => {
      column.classList.remove('drag-over');
    });
    
    // Atualizar contadores após mover o card
    updateColumnCounts();
  });
}

function setupColumnDragEvents(column) {
  column.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    
    column.classList.add('drag-over');
    
    const afterElement = getDragAfterElement(column, e.clientY);
    if (afterElement == null) {
      column.appendChild(dragging);
    } else {
      column.insertBefore(dragging, afterElement);
    }
  });
  
  column.addEventListener("dragleave", () => {
    column.classList.remove('drag-over');
  });
  
  column.addEventListener("drop", (e) => {
    e.preventDefault();
    column.classList.remove('drag-over');
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".kanban-card:not(.dragging)")];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Simular mensagens em tempo real
function startMessageSimulation() {
  let messageIndex = 0;
  
  messageInterval = setInterval(() => {
    if (messageIndex < predefinedMessages.length) {
      const message = predefinedMessages[messageIndex];
      addSimulatedMessage(message.user, message.text);
      messageIndex++;
    }
  }, 8000); // Nova mensagem a cada 8 segundos
}

function addSimulatedMessage(userImg, text) {
  // Selecionar um card aleatório para adicionar a mensagem
  const cards = document.querySelectorAll('.kanban-card');
  if (cards.length === 0) return;
  
  const randomCard = cards[Math.floor(Math.random() * cards.length)];
  const commentsSection = randomCard.querySelector('.comments-section');
  const addCommentDiv = randomCard.querySelector('.add-comment');
  
  if (!commentsSection || !addCommentDiv) return;
  
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';
  commentDiv.innerHTML = `
    <img src="src/images/${userImg}" alt="${users[userImg]}">
    <div class="comment-content">
      <strong>${users[userImg]}</strong>
      <p>${processMentions(text)}</p>
      <div class="comment-actions">
        <span>Agora</span>
        <button class="like-comment"><i class="fa-regular fa-heart"></i> 0</button>
        <button class="reply-btn">Responder</button>
      </div>
    </div>
  `;
  
  commentsSection.insertBefore(commentDiv, addCommentDiv);
  
  // Configurar interações do novo comentário
  const likeBtn = commentDiv.querySelector('.like-comment');
  const replyBtn = commentDiv.querySelector('.reply-btn');
  
  likeBtn.addEventListener('click', function() {
    toggleCommentLike(this);
  });
  
  replyBtn.addEventListener('click', function() {
    const author = commentDiv.querySelector('strong').textContent;
    const commentInput = randomCard.querySelector('.comment-input input');
    if (commentInput) {
      commentInput.value = `@${author} `;
      commentInput.focus();
    }
  });
  
  // Mostrar notificação
  showNotification(`${users[userImg]} enviou uma mensagem`);
  
  // Adicionar reação aleatória a algum comentário existente
  addRandomReaction();
}

function addRandomReaction() {
  const likeButtons = document.querySelectorAll('.like-comment');
  if (likeButtons.length > 0) {
    const randomButton = likeButtons[Math.floor(Math.random() * likeButtons.length)];
    // Apenas adicionar like se não tiver sido curtido ainda
    if (!randomButton.classList.contains('active')) {
      toggleCommentLike(randomButton);
      const userName = randomButton.closest('.comment').querySelector('strong').textContent;
      showNotification(`${userName} recebeu uma curtida`);
    }
  }
}

function showNotification(message) {
  const notificationCenter = document.querySelector('.notification-center');
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  notificationCenter.appendChild(notification);
  
  // Remover notificação após 5 segundos
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// Parar a simulação quando a página for fechada
window.addEventListener('beforeunload', () => {
  if (messageInterval) {
    clearInterval(messageInterval);
  }
});