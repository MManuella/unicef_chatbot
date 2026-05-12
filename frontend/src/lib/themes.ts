import { HealthTheme } from "./types";

export const HEALTH_THEMES: HealthTheme[] = [
  {
    id: "hiv-aids",
    name: "VIH / SIDA",
    icon: "mdi:virus",
    color: "#e74c3c",
    description:
      "Informations sur le VIH/SIDA : transmission, prévention, dépistage et vie avec le virus.",
    suggestedQuestions: [
      "Comment se transmet le VIH ?",
      "Comment me faire dépister pour le VIH ?",
      "Qu'est-ce que la PrEP et comment fonctionne-t-elle ?",
      "Quels sont les symptômes du VIH ?",
      "Quelle est la différence entre le VIH et le SIDA ?",
    ],
  },
  {
    id: "sti-prevention",
    name: "IST et Prévention",
    icon: "mdi:shield-health",
    color: "#e67e22",
    description:
      "Infections sexuellement transmissibles : types, symptômes, prévention et traitement.",
    suggestedQuestions: [
      "Quelles sont les IST les plus courantes ?",
      "Comment me protéger contre les IST ?",
      "Quels sont les symptômes de la chlamydia ?",
      "À quelle fréquence dois-je me faire dépister ?",
      "Les IST peuvent-elles être guéries ?",
    ],
  },
  {
    id: "mental-health",
    name: "Santé Mentale",
    icon: "mdi:brain",
    color: "#9b59b6",
    description:
      "Bien-être mental, stress, anxiété, dépression et ressources de soutien psychologique.",
    suggestedQuestions: [
      "Quels sont les signes de la dépression ?",
      "Comment gérer l'anxiété ?",
      "Où trouver un soutien psychologique ?",
      "Quelle est la différence entre le stress et le burn-out ?",
      "Comment parler de ma santé mentale à quelqu'un ?",
    ],
  },
  {
    id: "nutrition",
    name: "Nutrition",
    icon: "mdi:food-apple",
    color: "#27ae60",
    description:
      "Alimentation saine, équilibre nutritionnel, malnutrition et recommandations alimentaires.",
    suggestedQuestions: [
      "Qu'est-ce qu'une alimentation équilibrée ?",
      "Comment prévenir la malnutrition chez les enfants ?",
      "Quels sont les signes d'une carence en fer ?",
      "Quelle quantité d'eau dois-je boire par jour ?",
      "Quels aliments renforcent le système immunitaire ?",
    ],
  },
  {
    id: "vaccination",
    name: "Vaccination",
    icon: "mdi:needle",
    color: "#3498db",
    description:
      "Vaccins, calendriers de vaccination, effets secondaires et importance de la vaccination.",
    suggestedQuestions: [
      "Quels vaccins sont recommandés pour les enfants ?",
      "Les vaccins sont-ils sans danger ?",
      "Qu'est-ce que l'immunité collective ?",
      "Quels vaccins dois-je faire en tant qu'adulte ?",
      "Comment fonctionnent les vaccins ?",
    ],
  },
  {
    id: "maternal-health",
    name: "Santé Maternelle",
    icon: "mdi:mother-nurse",
    color: "#ff7675",
    description:
      "Grossesse, soins prénataux, accouchement et santé post-partum pour les mères et les nouveau-nés.",
    suggestedQuestions: [
      "Quels soins prénataux sont recommandés ?",
      "Comment avoir une grossesse en bonne santé ?",
      "Quels sont les signes d'alerte pendant la grossesse ?",
      "Quelle est l'importance de l'allaitement ?",
      "Qu'est-ce que la dépression post-partum ?",
    ],
  },
  {
    id: "child-health",
    name: "Santé de l'Enfant",
    icon: "mdi:baby-face-outline",
    color: "#00b894",
    description:
      "Croissance, développement, maladies infantiles et soins préventifs pour les enfants.",
    suggestedQuestions: [
      "Comment savoir si mon enfant se développe normalement ?",
      "Quels sont les signes de malnutrition chez l'enfant ?",
      "Comment prévenir la diarrhée chez les enfants ?",
      "À quel âge un enfant commence-t-il à marcher ?",
      "Quelles sont les maladies infantiles courantes ?",
    ],
  },
  {
    id: "malaria",
    name: "Paludisme",
    icon: "mdi:mosquito-off",
    color: "#f39c12",
    description:
      "Prévention du paludisme, symptômes, diagnostic et traitement dans les régions endémiques.",
    suggestedQuestions: [
      "Comment se transmet le paludisme ?",
      "Quels sont les symptômes du paludisme ?",
      "Comment prévenir le paludisme ?",
      "Existe-t-il un vaccin contre le paludisme ?",
      "Comment traite-t-on le paludisme ?",
    ],
  },
  {
    id: "water-sanitation",
    name: "Eau et Hygiène",
    icon: "mdi:water",
    color: "#74b9ff",
    description:
      "Accès à l'eau potable, pratiques d'hygiène et assainissement pour prévenir les maladies.",
    suggestedQuestions: [
      "Comment purifier l'eau de boisson ?",
      "Quelles maladies sont causées par une eau contaminée ?",
      "À quelle fréquence dois-je me laver les mains ?",
      "Qu'est-ce qu'un bon assainissement ?",
      "Comment le manque d'hygiène affecte-t-il la santé ?",
    ],
  },
  {
    id: "addictions",
    name: "Addictions",
    icon: "mdi:smoking-off",
    color: "#636e72",
    description:
      "Consommation de substances, tabac, alcool, dépendances et soutien à la guérison.",
    suggestedQuestions: [
      "Comment savoir si j'ai une addiction ?",
      "Quels sont les effets du tabac sur la santé ?",
      "Comment arrêter de boire de l'alcool ?",
      "Où trouver une aide pour une addiction ?",
      "Quelle est la différence entre dépendance et addiction ?",
    ],
  },
];

export const getThemeById = (id: string): HealthTheme | undefined =>
  HEALTH_THEMES.find((t) => t.id === id);
