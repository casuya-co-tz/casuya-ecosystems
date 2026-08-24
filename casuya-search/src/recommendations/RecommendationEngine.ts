/**
 * RecommendationEngine - Content recommendation system
 * Provides personalized content recommendations based on user behavior
 */

import { Recommendation, SearchDocument } from '../types';

export class RecommendationEngine {
  private userInteractions: Map<string, UserInteraction[]>;
  private documentSimilarity: Map<string, string[]>;
  private documents: Map<string, SearchDocument>;
  private maxRecommendations: number;

  constructor(maxRecommendations: number = 10) {
    this.userInteractions = new Map();
    this.documentSimilarity = new Map();
    this.documents = new Map();
    this.maxRecommendations = maxRecommendations;
  }

  /**
   * Index documents for profile building
   */
  indexDocuments(documents: SearchDocument[]): void {
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }

  /**
   * Get recommendations for a user
   */
  getRecommendations(userId: string, allDocuments: SearchDocument[]): Recommendation[] {
    this.indexDocuments(allDocuments);

    const interactions = this.userInteractions.get(userId) || [];
    const recommendations: Recommendation[] = [];

    if (interactions.length === 0) {
      return this.getPopularRecommendations(allDocuments);
    }

    // Build user profile from interactions
    const userProfile = this.buildUserProfile(interactions);

    // Score documents based on user profile
    for (const doc of allDocuments) {
      const score = this.calculateRecommendationScore(doc, userProfile);

      if (score > 0) {
        recommendations.push({
          documentId: doc.id,
          reason: this.generateReason(doc, userProfile),
          score,
        });
      }
    }

    // Sort by score and return top results
    return recommendations.sort((a, b) => b.score - a.score).slice(0, this.maxRecommendations);
  }

  /**
   * Record a user interaction with a document
   */
  recordInteraction(userId: string, documentId: string, type: InteractionType): void {
    const interactions = this.userInteractions.get(userId) || [];
    interactions.push({
      documentId,
      type,
      timestamp: new Date(),
    });
    this.userInteractions.set(userId, interactions);
  }

  /**
   * Build user profile from interaction history
   */
  private buildUserProfile(interactions: UserInteraction[]): UserProfile {
    const profile: UserProfile = {
      preferredSubjects: new Map(),
      preferredTopics: new Map(),
      preferredDifficulty: new Map(),
      preferredTags: new Map(),
    };

    for (const interaction of interactions) {
      const weight = this.getInteractionWeight(interaction.type);
      const doc = this.documents.get(interaction.documentId);
      if (!doc) continue;

      if (doc.subject) {
        profile.preferredSubjects.set(
          doc.subject,
          (profile.preferredSubjects.get(doc.subject) || 0) + weight
        );
      }

      if (doc.topic) {
        profile.preferredTopics.set(
          doc.topic,
          (profile.preferredTopics.get(doc.topic) || 0) + weight
        );
      }

      if (doc.difficulty) {
        profile.preferredDifficulty.set(
          doc.difficulty,
          (profile.preferredDifficulty.get(doc.difficulty) || 0) + weight
        );
      }

      for (const tag of doc.tags) {
        profile.preferredTags.set(tag, (profile.preferredTags.get(tag) || 0) + weight);
      }
    }

    return profile;
  }

  /**
   * Calculate recommendation score for a document
   */
  private calculateRecommendationScore(document: SearchDocument, profile: UserProfile): number {
    let score = 0;

    // Subject matching
    if (document.subject && profile.preferredSubjects.has(document.subject)) {
      score += profile.preferredSubjects.get(document.subject)!;
    }

    // Topic matching
    if (document.topic && profile.preferredTopics.has(document.topic)) {
      score += profile.preferredTopics.get(document.topic)!;
    }

    // Difficulty matching
    if (document.difficulty && profile.preferredDifficulty.has(document.difficulty)) {
      score += profile.preferredDifficulty.get(document.difficulty)!;
    }

    // Tag matching
    for (const tag of document.tags) {
      if (profile.preferredTags.has(tag)) {
        score += profile.preferredTags.get(tag)!;
      }
    }

    return score;
  }

  /**
   * Generate a human-readable reason for recommendation
   */
  private generateReason(document: SearchDocument, profile: UserProfile): string {
    if (document.subject && profile.preferredSubjects.has(document.subject)) {
      return `Based on your interest in ${document.subject}`;
    }
    if (document.topic && profile.preferredTopics.has(document.topic)) {
      return `Based on your interest in ${document.topic}`;
    }
    return 'Recommended for you';
  }

  /**
   * Get popular recommendations for new users
   */
  private getPopularRecommendations(documents: SearchDocument[]): Recommendation[] {
    // Simple implementation: return recent documents
    return documents
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, this.maxRecommendations)
      .map((doc) => ({
        documentId: doc.id,
        reason: 'Popular content',
        score: 1,
      }));
  }

  /**
   * Get weight for interaction type
   */
  private getInteractionWeight(type: InteractionType): number {
    const weights: Record<InteractionType, number> = {
      view: 1,
      like: 3,
      complete: 5,
      bookmark: 4,
    };
    return weights[type];
  }

  /**
   * Clear user interactions
   */
  clearUserInteractions(userId: string): void {
    this.userInteractions.delete(userId);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.userInteractions.clear();
    this.documentSimilarity.clear();
  }
}

interface UserInteraction {
  documentId: string;
  type: InteractionType;
  timestamp: Date;
}

type InteractionType = 'view' | 'like' | 'complete' | 'bookmark';

interface UserProfile {
  preferredSubjects: Map<string, number>;
  preferredTopics: Map<string, number>;
  preferredDifficulty: Map<string, number>;
  preferredTags: Map<string, number>;
}
