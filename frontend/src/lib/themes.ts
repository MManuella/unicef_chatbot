import { HealthTheme } from "./types";

export const HEALTH_THEMES: HealthTheme[] = [
  {
    id: "vih_sida",
    name: "VIH / SIDA",
    icon: "mdi:virus",
    color: "#e74c3c",
    description:
      "Informations sur le VIH/SIDA : transmission du VIH, prévention, dépistage et vie avec le virus.",
    suggestedQuestions: [
      "Comment le VIH se transmet-il lors de rapports sexuels non protégés ?",
      "Où puis-je faire un dépistage du VIH gratuitement et de façon confidentielle ?",
      "La PrEP protège-t-elle vraiment contre le VIH et qui peut y accéder ?",
      "Quels sont les premiers signes d'une infection au VIH après une prise de risque ?",
      "Peut-on mener une vie normale et avoir des enfants en étant séropositif ?",
      "Quelle est la différence entre être séropositif et avoir le SIDA ?",
    ],
  },
  {
    id: "sante_reproductive",
    name: "Santé reproductive",
    icon: "mdi:human-pregnant",
    color: "#e91e8c",
    description:
      "Contraception, planification familiale, grossesse et droits en matière de santé reproductive.",
    suggestedQuestions: [
      "Quels sont les avantages et les risques de la pilule contraceptive au quotidien ?",
      "Que faire en cas de rapport non protégé pour éviter une grossesse ?",
      "Comment fonctionne le stérilet et à partir de quel âge peut-on le poser ?",
      "Quels sont les signes très précoces d'une grossesse dans les premiers jours ?",
      "Comment accéder gratuitement à la planification familiale près de chez moi ?",
      "Quels droits ai-je si je veux interrompre une grossesse non désirée ?",
    ],
  },
  {
    id: "hygiene_menstruelle",
    name: "Hygiène menstruelle",
    icon: "mdi:water-circle",
    color: "#d63384",
    description:
      "Gestion de l'hygiène menstruelle, produits disponibles, tabous et droits des jeunes filles.",
    suggestedQuestions: [
      "Quelle est la différence entre serviette, tampon et coupe menstruelle ?",
      "Pourquoi est-ce que j'ai des crampes très douloureuses pendant mes règles ?",
      "Avoir des cycles de 30 à 35 jours est-il considéré comme normal ?",
      "Comment gérer ses règles discrètement à l'école ou au travail ?",
      "Qu'est-ce que le syndrome prémenstruel et comment en réduire les effets ?",
      "Est-il sans danger de faire du sport ou de se baigner pendant ses règles ?",
    ],
  },
  {
    id: "ist",
    name: "IST",
    icon: "mdi:shield-alert",
    color: "#e67e22",
    description:
      "Infections sexuellement transmissibles : types, symptômes, prévention et traitement.",
    suggestedQuestions: [
      "Quels sont les signes visibles d'une chlamydia ou d'une gonorrhée chez les jeunes ?",
      "Le préservatif protège-t-il contre toutes les IST sans exception ?",
      "Est-il possible d'avoir une IST pendant des années sans aucun symptôme ?",
      "À quelle fréquence dois-je faire un bilan IST si j'ai plusieurs partenaires ?",
      "La syphilis est-elle encore fréquente aujourd'hui et comment se traite-t-elle ?",
      "L'herpès génital se guérit-il complètement ou reste-t-il à vie ?",
    ],
  },
  {
    id: "sante_mentale",
    name: "Santé mentale",
    icon: "mdi:brain",
    color: "#9b59b6",
    description:
      "Bien-être mental, stress, anxiété, dépression et ressources de soutien psychologique.",
    suggestedQuestions: [
      "Comment distinguer une tristesse passagère d'une vraie dépression ?",
      "Quelles techniques simples peuvent aider à réduire l'anxiété rapidement ?",
      "Vers qui me tourner si je me sens seul et que je n'ai personne à qui parler ?",
      "Comment aider un ami qui parle de se faire du mal sans l'aggraver ?",
      "Le stress des examens peut-il provoquer des troubles physiques réels ?",
      "Est-ce que consulter un psychologue signifie que je suis faible ou fou ?",
    ],
  },
  {
    id: "epidemie",
    name: "Conseils pratiques épidémies",
    icon: "mdi:biohazard",
    color: "#f39c12",
    description:
      "Prévention et gestion des épidémies : comportements à adopter, gestes barrières et ressources.",
    suggestedQuestions: [
      "Quels gestes barrières adopter dès les premières heures d'une épidémie ?",
      "Comment distinguer les symptômes de la dengue de ceux du paludisme ?",
      "Que mettre dans une trousse d'urgence familiale en cas d'épidémie ?",
      "Comment protéger les enfants et les personnes âgées lors d'une épidémie ?",
      "Quelle est la différence entre quarantaine, isolement et confinement ?",
      "Comment vérifier si une information sur une épidémie vient d'une source fiable ?",
    ],
  },
];

export const getThemeById = (id: string): HealthTheme | undefined =>
  HEALTH_THEMES.find((t) => t.id === id);
