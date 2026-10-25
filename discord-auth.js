// discord-auth.js - Gestion de l'authentification Discord OAuth2 pour FantaLand
// Pour configurer ton application Discord :
// 1. Va sur https://discord.com/developers/applications
// 2. Crée une application ou utilise la tienne
// 3. Dans "OAuth2", ajoute l'URL de redirection (ex: l'URL de ton site ou http://localhost/...)
// 4. Colle ton CLIENT_ID ci-dessous :

const DISCORD_AUTH_CONFIG = {
  // Si tu as un Client ID Discord, indique-le ici :
  clientId: "1473392658692182171", // Remplacer par ton vrai Client ID Discord
  redirectUri: window.location.origin + window.location.pathname,
  scope: "identify",
};

// Initialisation au chargement de chaque page
document.addEventListener("DOMContentLoaded", () => {
  handleDiscordOAuthCallback();
  updateUserNavUI();
});

// Vérifie si on revient d'une redirection Discord (#access_token=... ou ?token=...)
function handleDiscordOAuthCallback() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");

  if (accessToken) {
    // Récupérer le profil Discord de l'utilisateur
    fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((user) => {
        if (user && user.id) {
          const avatarUrl = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${user.discriminator && user.discriminator !== "0" ? user.discriminator % 5 : (user.id >> 22) % 6}.png`;

          const sessionData = {
            id: user.id,
            username: user.global_name || user.username,
            avatar: avatarUrl,
          };

          localStorage.setItem(
            "fantaland_discord_user",
            JSON.stringify(sessionData),
          );

          // Nettoyer l'URL sans recharger la page
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search,
          );
          updateUserNavUI();
        }
      })
      .catch((err) => {
        console.error("Erreur profil Discord:", err);
      });
  }
}

// Fonction appelée quand on clique sur "Connexion"
const DISCORD_EXACT_AUTH_URL = "https://discord.com/oauth2/authorize?client_id=1473392658692182171&response_type=token&redirect_uri=https%3A%2F%2Fzetorxh1.github.io%2Ffantaland-reglement%2F&scope=identify";

function initiateDiscordLogin(e) {
  if (e) e.preventDefault();
  window.location.href = DISCORD_EXACT_AUTH_URL;
}

// Ouvre une fenêtre modale élégante FantaLand
function openDiscordLoginModal() {
  let modal = document.getElementById("discord-login-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "discord-login-modal";
    modal.className = "discord-auth-modal-overlay";
    modal.innerHTML = `
            <div class="discord-auth-modal-box">
                <button type="button" class="discord-modal-close" onclick="closeDiscordLoginModal()">&times;</button>
                <div class="discord-modal-icon">
                    <i class="fa-brands fa-discord"></i>
                </div>
                <h3 class="discord-modal-title">Connexion FantaLand</h3>
                <p class="discord-modal-desc">
                    Connecte-toi avec ton compte Discord pour accéder à ton espace joueur FantaLand.
                </p>
                <div class="discord-modal-actions">
                    <button type="button" class="btn-discord-login-submit" onclick="initiateDiscordLogin()">
                        <i class="fa-brands fa-discord"></i>
                        <span>Continuer avec Discord</span>
                    </button>
                    <a href="https://discord.gg/66PMysp5nz" target="_blank" rel="noopener" class="btn-discord-join-secondary">
                        Rejoindre le serveur FantaLand
                    </a>
                </div>
            </div>
        `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (ev) => {
      if (ev.target === modal) closeDiscordLoginModal();
    });
  }
  modal.style.display = "flex";
}

function closeDiscordLoginModal() {
  const modal = document.getElementById("discord-login-modal");
  if (modal) modal.style.display = "none";
}

// Simulation rapide pour tester instantanément sans avoir besoin de créer d'app developer Discord immédiatement
function simulateDiscordLoginFast() {
  const defaultUser = {
    id: "1",
    username: "Joueur FantaLand",
    avatar: "images/galerie-4.jpg",
  };
  const inputName = prompt(
    "Entre ton pseudo Discord pour te connecter :",
    "FantaPlayer",
  );
  if (inputName) {
    defaultUser.username = inputName.trim();
    localStorage.setItem("fantaland_discord_user", JSON.stringify(defaultUser));
    closeDiscordLoginModal();
    updateUserNavUI();
  }
}

// Déconnexion
function logoutDiscord() {
  localStorage.removeItem("fantaland_discord_user");
  updateUserNavUI();
}

// Met à jour l'en-tête de toutes les pages (Avatar + Nom + Menu déroulant)
function updateUserNavUI() {
  let saved = null;
  try {
    const raw = localStorage.getItem("fantaland_discord_user");
    if (raw) saved = JSON.parse(raw);
  } catch (e) {}

  const authBtns = document.querySelectorAll(".link-connexion");
  authBtns.forEach((btn) => {
    if (saved && saved.username) {
      btn.href = "#";
      btn.onclick = (e) => {
        e.preventDefault();
        toggleUserDropdown(btn);
      };
      btn.innerHTML = `
                <div class="discord-user-badge">
                    <img src="${saved.avatar}" class="discord-user-nav-avatar" alt="${saved.username}">
                    <span class="discord-user-nav-name">${saved.username}</span>
                    <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 3px; color: #a1a1aa;"></i>
                </div>
            `;
      btn.classList.add("is-connected");
    } else {
      btn.href = "#";
      btn.onclick = initiateDiscordLogin;
      btn.innerHTML = `
                <i class="fa-brands fa-discord" style="color: #5865F2;"></i>
                <span>Connexion</span>
            `;
      btn.classList.remove("is-connected");
    }
  });
}

// Menu déroulant de l'utilisateur connecté
function toggleUserDropdown(triggerEl) {
  let menu = document.getElementById("discord-user-dropdown-menu");
  if (menu) {
    menu.remove();
    return;
  }

  menu = document.createElement("div");
  menu.id = "discord-user-dropdown-menu";
  menu.className = "discord-dropdown-menu";
  menu.innerHTML = `
        <div class="dropdown-header-info">Connecté avec Discord</div>
        <a href="galerie.html" class="dropdown-menu-item">
            <i class="fa-regular fa-image"></i>
            <span>Mes souvenirs</span>
        </a>
        <a href="https://discord.gg/66PMysp5nz" target="_blank" rel="noopener" class="dropdown-menu-item">
            <i class="fa-brands fa-discord"></i>
            <span>Serveur Discord</span>
        </a>
        <div class="dropdown-divider"></div>
        <button type="button" class="dropdown-menu-item logout-item" onclick="logoutDiscord()">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Déconnexion</span>
        </button>
    `;

  document.body.appendChild(menu);

  const rect = triggerEl.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.top = rect.bottom + 8 + "px";
  menu.style.left = rect.right - 180 + "px";
  menu.style.zIndex = "9999";

  const closeOnOutside = (ev) => {
    if (!menu.contains(ev.target) && !triggerEl.contains(ev.target)) {
      menu.remove();
      document.removeEventListener("click", closeOnOutside);
    }
  };
  setTimeout(() => {
    document.addEventListener("click", closeOnOutside);
  }, 10);
}
