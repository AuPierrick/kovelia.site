(function(){
  "use strict";

  /* ---------- Réduction continue du header/sous-menu au scroll ---------- */
  var SHRINK_DISTANCE = 40; // px de scroll sur lesquels la réduction s'étale
  var ticking = false;
  var applyScrollState = function(){
    var y = window.scrollY || window.pageYOffset || 0;
    if(y < 0) y = 0; // ignore le rebond élastique négatif de certains navigateurs/trackpads
    var t = Math.min(1, y / SHRINK_DISTANCE);
    document.documentElement.style.setProperty("--shrink", t.toFixed(3));
    document.body.classList.toggle("is-compact", t >= 1);
    ticking = false;
  };
  var setCompact = function(){
    if(!ticking){
      window.requestAnimationFrame(applyScrollState);
      ticking = true;
    }
  };
  window.addEventListener("scroll", setCompact, { passive: true });
  applyScrollState();

  /* ---------- Menu mobile ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  if(navToggle && mainNav){
    navToggle.addEventListener("click", function(){
      var open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Sous-menu "Outils" (dropdown) ---------- */
  document.querySelectorAll(".has-submenu").forEach(function(item){
    var btn = item.querySelector("button");
    if(!btn) return;
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".has-submenu.open").forEach(function(o){ o.classList.remove("open"); o.querySelector("button").setAttribute("aria-expanded","false"); });
      if(!isOpen){
        item.classList.add("open");
        btn.setAttribute("aria-expanded","true");
      }
    });
  });
  document.addEventListener("click", function(){
    document.querySelectorAll(".has-submenu.open").forEach(function(o){
      o.classList.remove("open");
      o.querySelector("button").setAttribute("aria-expanded","false");
    });
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape"){
      document.querySelectorAll(".has-submenu.open").forEach(function(o){
        o.classList.remove("open");
        o.querySelector("button").setAttribute("aria-expanded","false");
      });
    }
  });

  /* ---------- Recherche (overlay) ---------- */
  var searchToggle = document.querySelector(".search-toggle");
  var searchOverlay = document.querySelector(".search-overlay");
  var searchInput = document.querySelector(".search-panel input[type='search']");
  var searchResults = document.querySelector(".search-results");
  var searchEmpty = document.querySelector(".search-empty");

  // Base du site : "" à la racine, "../" un niveau plus bas, "../../" deux niveaux plus bas.
  var base = document.body.getAttribute("data-base") || "";

  var SITE_INDEX = [
    { title: "Accueil", desc: "Présentation du site et des outils.", url: base + "", keywords: "accueil home pierrick outils" },
    { title: "Import Tool for HelloAsso", desc: "Extension Google Sheets pour importer les données HelloAsso.", url: base + "Import-Tool-for-HelloAsso/", keywords: "helloasso import sheets extension google api présentation" },
    { title: "Documentation — Import Tool for HelloAsso", desc: "Guide d'installation, de configuration et d'utilisation.", url: base + "Import-Tool-for-HelloAsso/Documentation/", keywords: "documentation guide installation configuration utilisation aide" },
    { title: "Politique de confidentialité — Import Tool for HelloAsso", desc: "Données traitées, stockage et droits RGPD.", url: base + "Import-Tool-for-HelloAsso/Politique-de-confidentialite/", keywords: "confidentialité rgpd données vie privée" },
    { title: "Conditions d'utilisation — Import Tool for HelloAsso", desc: "Conditions générales d'utilisation de l'extension.", url: base + "Import-Tool-for-HelloAsso/Conditions-Utilisation/", keywords: "cgu conditions utilisation licence" },
    { title: "Mentions légales — Import Tool for HelloAsso", desc: "Éditeur, hébergement et propriété intellectuelle.", url: base + "Import-Tool-for-HelloAsso/Mentions-Legales/", keywords: "mentions légales éditeur hébergement" },
    { title: "Contact / Support", desc: "Envoyer un message pour une question ou un problème.", url: base + "Contact-Support/", keywords: "contact support aide question message formulaire" }
  ];

  function openSearch(){
    if(!searchOverlay) return;
    searchOverlay.classList.add("open");
    searchOverlay.setAttribute("aria-hidden", "false");
    renderResults("");
    setTimeout(function(){ searchInput && searchInput.focus(); }, 10);
  }
  function closeSearch(){
    if(!searchOverlay) return;
    searchOverlay.classList.remove("open");
    searchOverlay.setAttribute("aria-hidden", "true");
  }
  if(searchToggle){
    searchToggle.addEventListener("click", function(e){
      e.stopPropagation();
      if(searchOverlay.classList.contains("open")) closeSearch(); else openSearch();
    });
  }
  if(searchOverlay){
    searchOverlay.addEventListener("click", function(e){
      if(e.target === searchOverlay) closeSearch();
    });
  }
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeSearch();
    if((e.key === "/" ) && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA"){
      e.preventDefault();
      openSearch();
    }
  });

  function renderResults(query){
    if(!searchResults) return;
    var q = query.trim().toLowerCase();
    var matches = SITE_INDEX.filter(function(item){
      if(!q) return true;
      return (item.title + " " + item.desc + " " + item.keywords).toLowerCase().indexOf(q) !== -1;
    });
    searchResults.innerHTML = "";
    if(matches.length === 0){
      searchEmpty.style.display = "block";
      return;
    }
    searchEmpty.style.display = "none";
    matches.slice(0, 8).forEach(function(item){
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = item.url;
      a.innerHTML = "<strong>" + escapeHtml(item.title) + "</strong><span class='path'>" + escapeHtml(item.desc) + "</span>";
      li.appendChild(a);
      searchResults.appendChild(li);
    });
  }
  if(searchInput){
    searchInput.addEventListener("input", function(){ renderResults(searchInput.value); });
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }

  /* ---------- Sommaire actif sur pages légales ---------- */
  var tocLinks = document.querySelectorAll(".doc-toc a");
  if(tocLinks.length){
    var headings = Array.prototype.slice.call(document.querySelectorAll(".doc-content h2[id]"));
    var setActive = function(){
      var pos = window.scrollY + 140;
      var current = headings[0];
      headings.forEach(function(h){ if(h.offsetTop <= pos) current = h; });
      tocLinks.forEach(function(a){
        a.parentElement.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id);
      });
    };
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }

  /* ---------- Formulaire de contact ---------- */
  var form = document.getElementById("contact-form");
  if(form){
    var captchaA, captchaB;
    var captchaQuestionEl = document.getElementById("captcha-question");
    var captchaInput = document.getElementById("captcha-answer");

    function newCaptcha(){
      captchaA = Math.floor(Math.random() * 8) + 2;
      captchaB = Math.floor(Math.random() * 8) + 1;
      if(captchaQuestionEl) captchaQuestionEl.textContent = captchaA + " + " + captchaB + " = ?";
      if(captchaInput) captchaInput.value = "";
    }
    newCaptcha();

    var refreshBtn = document.querySelector(".captcha-refresh");
    if(refreshBtn) refreshBtn.addEventListener("click", newCaptcha);

    // Empêche toute balise/code dans les champs texte libres.
    var forbiddenPattern = /[<>]/;

    function setInvalid(row, message){
      row.classList.add("invalid");
      var err = row.querySelector(".error-text");
      if(err) err.textContent = message;
    }
    function clearInvalid(row){
      row.classList.remove("invalid");
    }

    form.addEventListener("submit", function(e){
      var valid = true;
      var statusEl = document.getElementById("form-status");

      var nameRow = document.getElementById("row-name");
      var nameInput = document.getElementById("field-name");
      clearInvalid(nameRow);
      if(!nameInput.value.trim()){
        setInvalid(nameRow, "Merci d'indiquer votre nom et votre organisme.");
        valid = false;
      } else if(forbiddenPattern.test(nameInput.value)){
        setInvalid(nameRow, "Les caractères < et > ne sont pas autorisés.");
        valid = false;
      }

      var emailRow = document.getElementById("row-email");
      var emailInput = document.getElementById("field-email");
      clearInvalid(emailRow);
      var emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
      if(!emailPattern.test(emailInput.value.trim())){
        setInvalid(emailRow, "Merci d'indiquer une adresse e-mail valide.");
        valid = false;
      }

      var subjectRow = document.getElementById("row-subject");
      var subjectInput = document.getElementById("field-subject");
      clearInvalid(subjectRow);
      if(!subjectInput.value){
        setInvalid(subjectRow, "Merci de choisir un objet.");
        valid = false;
      }

      var messageRow = document.getElementById("row-message");
      var messageInput = document.getElementById("field-message");
      clearInvalid(messageRow);
      if(!messageInput.value.trim()){
        setInvalid(messageRow, "Merci de rédiger un message.");
        valid = false;
      } else if(forbiddenPattern.test(messageInput.value)){
        setInvalid(messageRow, "Les caractères < et > ne sont pas autorisés (pas de code ni de balises).");
        valid = false;
      } else if(messageInput.value.length > 3000){
        setInvalid(messageRow, "Le message est limité à 3000 caractères.");
        valid = false;
      }

      var captchaRow = document.getElementById("row-captcha");
      clearInvalid(captchaRow);
      if(parseInt(captchaInput.value, 10) !== captchaA + captchaB){
        setInvalid(captchaRow, "La réponse au calcul est incorrecte.");
        valid = false;
        newCaptcha();
      }

      // Piège à robots : ce champ doit rester vide.
      var honeypot = document.getElementById("field-honey");
      if(honeypot && honeypot.value){
        valid = false;
      }

      if(!valid){
        e.preventDefault();
        if(statusEl){
          statusEl.textContent = "Merci de corriger les champs indiqués ci-dessus avant l'envoi.";
          statusEl.className = "form-status show err";
        }
        return;
      }

      // Le formulaire est valide : il est laissé à l'action définie sur le <form>
      // (voir commentaire HTML pour la configuration de l'envoi).
    });
  }
})();
