/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type ActiveGate = {
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  question: Scalars['String']['output'];
};

export type AiUsageFilters = {
  OR?: InputMaybe<Array<AiUsageFiltersOr>>;
  requestCount?: InputMaybe<AiUsageRequestCountFilters>;
  usageDate?: InputMaybe<AiUsageUsageDateFilters>;
};

export type AiUsageFiltersOr = {
  requestCount?: InputMaybe<AiUsageRequestCountFilters>;
  usageDate?: InputMaybe<AiUsageUsageDateFilters>;
};

export type AiUsageInsertInput = {
  requestCount?: InputMaybe<Scalars['Int']['input']>;
  usageDate: Scalars['String']['input'];
};

export type AiUsageItem = {
  requestCount: Scalars['Int']['output'];
  usageDate: Scalars['String']['output'];
};

export type AiUsageOrderBy = {
  requestCount?: InputMaybe<InnerOrder>;
  usageDate?: InputMaybe<InnerOrder>;
};

export type AiUsageRequestCountFilters = {
  OR?: InputMaybe<Array<AiUsageRequestCountfiltersOr>>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type AiUsageRequestCountfiltersOr = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type AiUsageSelectItem = {
  requestCount: Scalars['Int']['output'];
  usageDate: Scalars['String']['output'];
};

export type AiUsageUpdateInput = {
  requestCount?: InputMaybe<Scalars['Int']['input']>;
  usageDate?: InputMaybe<Scalars['String']['input']>;
};

export type AiUsageUsageDateFilters = {
  OR?: InputMaybe<Array<AiUsageUsageDatefiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type AiUsageUsageDatefiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsAttemptCountAtRequestFilters = {
  OR?: InputMaybe<Array<ClueRateLimitsAttemptCountAtRequestfiltersOr>>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsAttemptCountAtRequestfiltersOr = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsFilters = {
  OR?: InputMaybe<Array<ClueRateLimitsFiltersOr>>;
  attemptCountAtRequest?: InputMaybe<ClueRateLimitsAttemptCountAtRequestFilters>;
  gateId?: InputMaybe<ClueRateLimitsGateIdFilters>;
  id?: InputMaybe<ClueRateLimitsIdFilters>;
  requestedAt?: InputMaybe<ClueRateLimitsRequestedAtFilters>;
  sessionProgressId?: InputMaybe<ClueRateLimitsSessionProgressIdFilters>;
};

export type ClueRateLimitsFiltersOr = {
  attemptCountAtRequest?: InputMaybe<ClueRateLimitsAttemptCountAtRequestFilters>;
  gateId?: InputMaybe<ClueRateLimitsGateIdFilters>;
  id?: InputMaybe<ClueRateLimitsIdFilters>;
  requestedAt?: InputMaybe<ClueRateLimitsRequestedAtFilters>;
  sessionProgressId?: InputMaybe<ClueRateLimitsSessionProgressIdFilters>;
};

export type ClueRateLimitsGateIdFilters = {
  OR?: InputMaybe<Array<ClueRateLimitsGateIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsGateIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsIdFilters = {
  OR?: InputMaybe<Array<ClueRateLimitsIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsInsertInput = {
  attemptCountAtRequest?: InputMaybe<Scalars['Int']['input']>;
  gateId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  requestedAt?: InputMaybe<Scalars['String']['input']>;
  sessionProgressId: Scalars['String']['input'];
};

export type ClueRateLimitsItem = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type ClueRateLimitsOrderBy = {
  attemptCountAtRequest?: InputMaybe<InnerOrder>;
  gateId?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  requestedAt?: InputMaybe<InnerOrder>;
  sessionProgressId?: InputMaybe<InnerOrder>;
};

export type ClueRateLimitsRequestedAtFilters = {
  OR?: InputMaybe<Array<ClueRateLimitsRequestedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsRequestedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsSelectItem = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgress: Maybe<ClueRateLimitsSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ClueRateLimitsSelectItemSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ClueRateLimitsSessionProgressIdFilters = {
  OR?: InputMaybe<Array<ClueRateLimitsSessionProgressIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsSessionProgressIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ClueRateLimitsSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  completedGates: Array<ClueRateLimitsSessionProgressRelationCompletedGatesRelation>;
  currentGate: Maybe<ClueRateLimitsSessionProgressRelationCurrentGateRelation>;
  currentGateId: Maybe<Scalars['String']['output']>;
  gateClues: Array<ClueRateLimitsSessionProgressRelationGateCluesRelation>;
  id: Scalars['String']['output'];
  program: Maybe<ClueRateLimitsSessionProgressRelationProgramRelation>;
  programId: Scalars['String']['output'];
  rateLimits: Array<ClueRateLimitsSessionProgressRelationRateLimitsRelation>;
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SessionCompletedGatesOrderBy>;
  where?: InputMaybe<SessionCompletedGatesFilters>;
};


export type ClueRateLimitsSessionProgressRelationCurrentGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ClueRateLimitsSessionProgressRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type ClueRateLimitsSessionProgressRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};


export type ClueRateLimitsSessionProgressRelationRateLimitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ClueRateLimitsOrderBy>;
  where?: InputMaybe<ClueRateLimitsFilters>;
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelation = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gate: Maybe<ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<ClueRateLimitsSessionProgressRelationCompletedGatesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationCompletedGatesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationCurrentGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<ClueRateLimitsSessionProgressRelationCurrentGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type ClueRateLimitsSessionProgressRelationCurrentGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationCurrentGateRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationCurrentGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<ClueRateLimitsSessionProgressRelationCurrentGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationCurrentGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type ClueRateLimitsSessionProgressRelationCurrentGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<ClueRateLimitsSessionProgressRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ClueRateLimitsSessionProgressRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type ClueRateLimitsSessionProgressRelationGateCluesRelationGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<ClueRateLimitsSessionProgressRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationProgramRelationGatesRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type ClueRateLimitsSessionProgressRelationRateLimitsRelation = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type ClueRateLimitsUpdateInput = {
  attemptCountAtRequest?: InputMaybe<Scalars['Int']['input']>;
  gateId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  requestedAt?: InputMaybe<Scalars['String']['input']>;
  sessionProgressId?: InputMaybe<Scalars['String']['input']>;
};

export type CompletedGate = {
  correctAnswer: Scalars['String']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  question: Scalars['String']['output'];
  successMessage: Scalars['String']['output'];
};

export type GateCluesAttemptCountAtRequestFilters = {
  OR?: InputMaybe<Array<GateCluesAttemptCountAtRequestfiltersOr>>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesAttemptCountAtRequestfiltersOr = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesClueTextFilters = {
  OR?: InputMaybe<Array<GateCluesClueTextfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesClueTextfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesCreatedAtFilters = {
  OR?: InputMaybe<Array<GateCluesCreatedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesCreatedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesFilters = {
  OR?: InputMaybe<Array<GateCluesFiltersOr>>;
  attemptCountAtRequest?: InputMaybe<GateCluesAttemptCountAtRequestFilters>;
  clueText?: InputMaybe<GateCluesClueTextFilters>;
  createdAt?: InputMaybe<GateCluesCreatedAtFilters>;
  gateId?: InputMaybe<GateCluesGateIdFilters>;
  id?: InputMaybe<GateCluesIdFilters>;
  sessionProgressId?: InputMaybe<GateCluesSessionProgressIdFilters>;
};

export type GateCluesFiltersOr = {
  attemptCountAtRequest?: InputMaybe<GateCluesAttemptCountAtRequestFilters>;
  clueText?: InputMaybe<GateCluesClueTextFilters>;
  createdAt?: InputMaybe<GateCluesCreatedAtFilters>;
  gateId?: InputMaybe<GateCluesGateIdFilters>;
  id?: InputMaybe<GateCluesIdFilters>;
  sessionProgressId?: InputMaybe<GateCluesSessionProgressIdFilters>;
};

export type GateCluesGateIdFilters = {
  OR?: InputMaybe<Array<GateCluesGateIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesGateIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<GateCluesGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<GateCluesGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type GateCluesGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type GateCluesGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type GateCluesGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type GateCluesGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<GateCluesGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type GateCluesGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type GateCluesGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GateCluesIdFilters = {
  OR?: InputMaybe<Array<GateCluesIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesInsertInput = {
  attemptCountAtRequest: Scalars['Int']['input'];
  clueText: Scalars['String']['input'];
  /** Date */
  createdAt?: InputMaybe<Scalars['String']['input']>;
  gateId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  sessionProgressId: Scalars['String']['input'];
};

export type GateCluesItem = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type GateCluesOrderBy = {
  attemptCountAtRequest?: InputMaybe<InnerOrder>;
  clueText?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  gateId?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  sessionProgressId?: InputMaybe<InnerOrder>;
};

export type GateCluesSelectItem = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<GateCluesGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<GateCluesSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type GateCluesSelectItemGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type GateCluesSelectItemSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type GateCluesSessionProgressIdFilters = {
  OR?: InputMaybe<Array<GateCluesSessionProgressIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesSessionProgressIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GateCluesSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  completedGates: Array<GateCluesSessionProgressRelationCompletedGatesRelation>;
  currentGate: Maybe<GateCluesSessionProgressRelationCurrentGateRelation>;
  currentGateId: Maybe<Scalars['String']['output']>;
  gateClues: Array<GateCluesSessionProgressRelationGateCluesRelation>;
  id: Scalars['String']['output'];
  program: Maybe<GateCluesSessionProgressRelationProgramRelation>;
  programId: Scalars['String']['output'];
  rateLimits: Array<GateCluesSessionProgressRelationRateLimitsRelation>;
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationCompletedGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SessionCompletedGatesOrderBy>;
  where?: InputMaybe<SessionCompletedGatesFilters>;
};


export type GateCluesSessionProgressRelationCurrentGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type GateCluesSessionProgressRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type GateCluesSessionProgressRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};


export type GateCluesSessionProgressRelationRateLimitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ClueRateLimitsOrderBy>;
  where?: InputMaybe<ClueRateLimitsFilters>;
};

export type GateCluesSessionProgressRelationCompletedGatesRelation = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gate: Maybe<GateCluesSessionProgressRelationCompletedGatesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<GateCluesSessionProgressRelationCompletedGatesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationCompletedGatesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type GateCluesSessionProgressRelationCompletedGatesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type GateCluesSessionProgressRelationCompletedGatesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<GateCluesSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<GateCluesSessionProgressRelationCompletedGatesRelationGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationCompletedGatesRelationGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type GateCluesSessionProgressRelationCompletedGatesRelationGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type GateCluesSessionProgressRelationCompletedGatesRelationGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationCompletedGatesRelationGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<GateCluesSessionProgressRelationCompletedGatesRelationGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationCompletedGatesRelationGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type GateCluesSessionProgressRelationCompletedGatesRelationGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationCompletedGatesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationCurrentGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<GateCluesSessionProgressRelationCurrentGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<GateCluesSessionProgressRelationCurrentGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationCurrentGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type GateCluesSessionProgressRelationCurrentGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type GateCluesSessionProgressRelationCurrentGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationCurrentGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<GateCluesSessionProgressRelationCurrentGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationCurrentGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type GateCluesSessionProgressRelationCurrentGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<GateCluesSessionProgressRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type GateCluesSessionProgressRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<GateCluesSessionProgressRelationProgramRelationGatesRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<GateCluesSessionProgressRelationProgramRelationGatesRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationProgramRelationGatesRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type GateCluesSessionProgressRelationProgramRelationGatesRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type GateCluesSessionProgressRelationProgramRelationGatesRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationProgramRelationGatesRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type GateCluesSessionProgressRelationRateLimitsRelation = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgress: Maybe<GateCluesSessionProgressRelationRateLimitsRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type GateCluesSessionProgressRelationRateLimitsRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type GateCluesSessionProgressRelationRateLimitsRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type GateCluesUpdateInput = {
  attemptCountAtRequest?: InputMaybe<Scalars['Int']['input']>;
  clueText?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  createdAt?: InputMaybe<Scalars['String']['input']>;
  gateId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  sessionProgressId?: InputMaybe<Scalars['String']['input']>;
};

export type GateManagement = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GatesAcceptanceThresholdFilters = {
  OR?: InputMaybe<Array<GatesAcceptanceThresholdfiltersOr>>;
  eq?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Float']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<Scalars['Float']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Float']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesAcceptanceThresholdfiltersOr = {
  eq?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Float']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<Scalars['Float']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Float']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesCorrectAnswerFilters = {
  OR?: InputMaybe<Array<GatesCorrectAnswerfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesCorrectAnswerfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesCreatedAtFilters = {
  OR?: InputMaybe<Array<GatesCreatedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesCreatedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesFilters = {
  OR?: InputMaybe<Array<GatesFiltersOr>>;
  acceptanceThreshold?: InputMaybe<GatesAcceptanceThresholdFilters>;
  correctAnswer?: InputMaybe<GatesCorrectAnswerFilters>;
  createdAt?: InputMaybe<GatesCreatedAtFilters>;
  guidanceEnabled?: InputMaybe<GatesGuidanceEnabledFilters>;
  guidanceThreshold?: InputMaybe<GatesGuidanceThresholdFilters>;
  id?: InputMaybe<GatesIdFilters>;
  label?: InputMaybe<GatesLabelFilters>;
  programId?: InputMaybe<GatesProgramIdFilters>;
  question?: InputMaybe<GatesQuestionFilters>;
  sequenceOrder?: InputMaybe<GatesSequenceOrderFilters>;
  successMessage?: InputMaybe<GatesSuccessMessageFilters>;
};

export type GatesFiltersOr = {
  acceptanceThreshold?: InputMaybe<GatesAcceptanceThresholdFilters>;
  correctAnswer?: InputMaybe<GatesCorrectAnswerFilters>;
  createdAt?: InputMaybe<GatesCreatedAtFilters>;
  guidanceEnabled?: InputMaybe<GatesGuidanceEnabledFilters>;
  guidanceThreshold?: InputMaybe<GatesGuidanceThresholdFilters>;
  id?: InputMaybe<GatesIdFilters>;
  label?: InputMaybe<GatesLabelFilters>;
  programId?: InputMaybe<GatesProgramIdFilters>;
  question?: InputMaybe<GatesQuestionFilters>;
  sequenceOrder?: InputMaybe<GatesSequenceOrderFilters>;
  successMessage?: InputMaybe<GatesSuccessMessageFilters>;
};

export type GatesGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<GatesGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<GatesGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type GatesGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type GatesGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type GatesGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GatesGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  completedGates: Array<GatesGateCluesRelationSessionProgressRelationCompletedGatesRelation>;
  currentGate: Maybe<GatesGateCluesRelationSessionProgressRelationCurrentGateRelation>;
  currentGateId: Maybe<Scalars['String']['output']>;
  gateClues: Array<GatesGateCluesRelationSessionProgressRelationGateCluesRelation>;
  id: Scalars['String']['output'];
  program: Maybe<GatesGateCluesRelationSessionProgressRelationProgramRelation>;
  programId: Scalars['String']['output'];
  rateLimits: Array<GatesGateCluesRelationSessionProgressRelationRateLimitsRelation>;
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};


export type GatesGateCluesRelationSessionProgressRelationCompletedGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SessionCompletedGatesOrderBy>;
  where?: InputMaybe<SessionCompletedGatesFilters>;
};


export type GatesGateCluesRelationSessionProgressRelationCurrentGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type GatesGateCluesRelationSessionProgressRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type GatesGateCluesRelationSessionProgressRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};


export type GatesGateCluesRelationSessionProgressRelationRateLimitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ClueRateLimitsOrderBy>;
  where?: InputMaybe<ClueRateLimitsFilters>;
};

export type GatesGateCluesRelationSessionProgressRelationCompletedGatesRelation = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gate: Maybe<GatesGateCluesRelationSessionProgressRelationCompletedGatesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<GatesGateCluesRelationSessionProgressRelationCompletedGatesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type GatesGateCluesRelationSessionProgressRelationCompletedGatesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type GatesGateCluesRelationSessionProgressRelationCompletedGatesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type GatesGateCluesRelationSessionProgressRelationCompletedGatesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GatesGateCluesRelationSessionProgressRelationCompletedGatesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type GatesGateCluesRelationSessionProgressRelationCurrentGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GatesGateCluesRelationSessionProgressRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type GatesGateCluesRelationSessionProgressRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<GatesGateCluesRelationSessionProgressRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type GatesGateCluesRelationSessionProgressRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type GatesGateCluesRelationSessionProgressRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GatesGateCluesRelationSessionProgressRelationRateLimitsRelation = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgress: Maybe<GatesGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type GatesGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type GatesGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type GatesGuidanceEnabledFilters = {
  OR?: InputMaybe<Array<GatesGuidanceEnabledfiltersOr>>;
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  gt?: InputMaybe<Scalars['Boolean']['input']>;
  gte?: InputMaybe<Scalars['Boolean']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Boolean']['input']>;
  lte?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesGuidanceEnabledfiltersOr = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  gt?: InputMaybe<Scalars['Boolean']['input']>;
  gte?: InputMaybe<Scalars['Boolean']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Boolean']['input']>;
  lte?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesGuidanceThresholdFilters = {
  OR?: InputMaybe<Array<GatesGuidanceThresholdfiltersOr>>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesGuidanceThresholdfiltersOr = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesIdFilters = {
  OR?: InputMaybe<Array<GatesIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesInsertInput = {
  acceptanceThreshold?: InputMaybe<Scalars['Float']['input']>;
  correctAnswer: Scalars['String']['input'];
  /** Date */
  createdAt?: InputMaybe<Scalars['String']['input']>;
  guidanceEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  guidanceThreshold?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  programId: Scalars['String']['input'];
  question: Scalars['String']['input'];
  sequenceOrder?: InputMaybe<Scalars['Int']['input']>;
  successMessage: Scalars['String']['input'];
};

export type GatesItem = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GatesLabelFilters = {
  OR?: InputMaybe<Array<GatesLabelfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesLabelfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesOrderBy = {
  acceptanceThreshold?: InputMaybe<InnerOrder>;
  correctAnswer?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  guidanceEnabled?: InputMaybe<InnerOrder>;
  guidanceThreshold?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  label?: InputMaybe<InnerOrder>;
  programId?: InputMaybe<InnerOrder>;
  question?: InputMaybe<InnerOrder>;
  sequenceOrder?: InputMaybe<InnerOrder>;
  successMessage?: InputMaybe<InnerOrder>;
};

export type GatesProgramIdFilters = {
  OR?: InputMaybe<Array<GatesProgramIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesProgramIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<GatesProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type GatesProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type GatesProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type GatesQuestionFilters = {
  OR?: InputMaybe<Array<GatesQuestionfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesQuestionfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesSelectItem = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<GatesGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<GatesProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type GatesSelectItemGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type GatesSelectItemProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type GatesSequenceOrderFilters = {
  OR?: InputMaybe<Array<GatesSequenceOrderfiltersOr>>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesSequenceOrderfiltersOr = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesSuccessMessageFilters = {
  OR?: InputMaybe<Array<GatesSuccessMessagefiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesSuccessMessagefiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type GatesUpdateInput = {
  acceptanceThreshold?: InputMaybe<Scalars['Float']['input']>;
  correctAnswer?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  createdAt?: InputMaybe<Scalars['String']['input']>;
  guidanceEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  guidanceThreshold?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  programId?: InputMaybe<Scalars['String']['input']>;
  question?: InputMaybe<Scalars['String']['input']>;
  sequenceOrder?: InputMaybe<Scalars['Int']['input']>;
  successMessage?: InputMaybe<Scalars['String']['input']>;
};

export type InnerOrder = {
  direction: OrderDirection;
  /** Priority of current field */
  priority: Scalars['Int']['input'];
};

export type Me = {
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Mutation = {
  createGate: Maybe<GateManagement>;
  createProgram: Maybe<ProgramManagement>;
  deleteGate: Scalars['Boolean']['output'];
  deleteProgram: Scalars['Boolean']['output'];
  reorderGates: Scalars['Boolean']['output'];
  requestClue: Maybe<RequestClueResult>;
  resetSession: Scalars['Boolean']['output'];
  submitGuess: Maybe<SubmitGuessPayload>;
  updateGate: Maybe<GateManagement>;
  updateProgram: Maybe<ProgramManagement>;
};


export type MutationCreateGateArgs = {
  acceptanceThreshold?: InputMaybe<Scalars['Float']['input']>;
  correctAnswer: Scalars['String']['input'];
  guidanceEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  guidanceThreshold?: InputMaybe<Scalars['Int']['input']>;
  label: Scalars['String']['input'];
  programId: Scalars['String']['input'];
  question: Scalars['String']['input'];
  sequenceOrder: Scalars['Int']['input'];
  successMessage: Scalars['String']['input'];
};


export type MutationCreateProgramArgs = {
  name: Scalars['String']['input'];
  visibility?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteGateArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteProgramArgs = {
  id: Scalars['String']['input'];
};


export type MutationReorderGatesArgs = {
  orderedGateIds: Array<Scalars['String']['input']>;
  programId: Scalars['String']['input'];
};


export type MutationRequestClueArgs = {
  currentGuess: Scalars['String']['input'];
  gateId: Scalars['String']['input'];
  programId: Scalars['String']['input'];
};


export type MutationResetSessionArgs = {
  programId: Scalars['String']['input'];
};


export type MutationSubmitGuessArgs = {
  gateId: Scalars['String']['input'];
  guess: Scalars['String']['input'];
  programId: Scalars['String']['input'];
};


export type MutationUpdateGateArgs = {
  acceptanceThreshold?: InputMaybe<Scalars['Float']['input']>;
  correctAnswer?: InputMaybe<Scalars['String']['input']>;
  guidanceEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  guidanceThreshold?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  question?: InputMaybe<Scalars['String']['input']>;
  sequenceOrder?: InputMaybe<Scalars['Int']['input']>;
  successMessage?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateProgramArgs = {
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['String']['input']>;
};

/** Order by direction */
export enum OrderDirection {
  /** Ascending order */
  Asc = 'asc',
  /** Descending order */
  Desc = 'desc'
}

export type ProgramListItem = {
  authorId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type ProgramManagement = {
  authorId: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type ProgramsAuthorIdFilters = {
  OR?: InputMaybe<Array<ProgramsAuthorIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsAuthorIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsCreatedAtFilters = {
  OR?: InputMaybe<Array<ProgramsCreatedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsCreatedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsFilters = {
  OR?: InputMaybe<Array<ProgramsFiltersOr>>;
  authorId?: InputMaybe<ProgramsAuthorIdFilters>;
  createdAt?: InputMaybe<ProgramsCreatedAtFilters>;
  id?: InputMaybe<ProgramsIdFilters>;
  name?: InputMaybe<ProgramsNameFilters>;
  visibility?: InputMaybe<ProgramsVisibilityFilters>;
};

export type ProgramsFiltersOr = {
  authorId?: InputMaybe<ProgramsAuthorIdFilters>;
  createdAt?: InputMaybe<ProgramsCreatedAtFilters>;
  id?: InputMaybe<ProgramsIdFilters>;
  name?: InputMaybe<ProgramsNameFilters>;
  visibility?: InputMaybe<ProgramsVisibilityFilters>;
};

export type ProgramsGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<ProgramsGatesRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<ProgramsGatesRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type ProgramsGatesRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type ProgramsGatesRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type ProgramsGatesRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<ProgramsGatesRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<ProgramsGatesRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ProgramsGatesRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ProgramsGatesRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  completedGates: Array<ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelation>;
  currentGate: Maybe<ProgramsGatesRelationGateCluesRelationSessionProgressRelationCurrentGateRelation>;
  currentGateId: Maybe<Scalars['String']['output']>;
  gateClues: Array<ProgramsGatesRelationGateCluesRelationSessionProgressRelationGateCluesRelation>;
  id: Scalars['String']['output'];
  program: Maybe<ProgramsGatesRelationGateCluesRelationSessionProgressRelationProgramRelation>;
  programId: Scalars['String']['output'];
  rateLimits: Array<ProgramsGatesRelationGateCluesRelationSessionProgressRelationRateLimitsRelation>;
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SessionCompletedGatesOrderBy>;
  where?: InputMaybe<SessionCompletedGatesFilters>;
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCurrentGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationRateLimitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ClueRateLimitsOrderBy>;
  where?: InputMaybe<ClueRateLimitsFilters>;
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelation = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gate: Maybe<ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCompletedGatesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationCurrentGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationRateLimitsRelation = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgress: Maybe<ProgramsGatesRelationGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type ProgramsGatesRelationGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type ProgramsGatesRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type ProgramsIdFilters = {
  OR?: InputMaybe<Array<ProgramsIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsInsertInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  createdAt?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  visibility?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsItem = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type ProgramsNameFilters = {
  OR?: InputMaybe<Array<ProgramsNamefiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsNamefiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsOrderBy = {
  authorId?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  name?: InputMaybe<InnerOrder>;
  visibility?: InputMaybe<InnerOrder>;
};

export type ProgramsSelectItem = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<ProgramsGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type ProgramsSelectItemGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type ProgramsUpdateInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  createdAt?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsVisibilityFilters = {
  OR?: InputMaybe<Array<ProgramsVisibilityfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgramsVisibilityfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type ProgressionPayload = {
  completedGates: Array<CompletedGate>;
  currentGate: Maybe<ActiveGate>;
  status: Scalars['String']['output'];
};

export type Query = {
  getInProgressProgram: Maybe<Scalars['String']['output']>;
  getProgramProgression: Maybe<ProgressionPayload>;
  me: Maybe<Me>;
  myPrograms: Maybe<Array<Maybe<ProgramListItem>>>;
  program: Maybe<ProgramListItem>;
  programGates: Array<GateManagement>;
  programs: Array<ProgramListItem>;
};


export type QueryGetProgramProgressionArgs = {
  programId: Scalars['String']['input'];
};


export type QueryProgramArgs = {
  id: Scalars['String']['input'];
};


export type QueryProgramGatesArgs = {
  programId: Scalars['String']['input'];
};

export type RequestClueResult = {
  clueText: Maybe<Scalars['String']['output']>;
  cluesRemaining: Scalars['Int']['output'];
  isAiBudgetExhausted: Scalars['Boolean']['output'];
  isClueLimitReached: Scalars['Boolean']['output'];
  isRateLimited: Scalars['Boolean']['output'];
  retryAfterMs: Maybe<Scalars['Int']['output']>;
};

export type SessionCompletedGatesCompletedAtFilters = {
  OR?: InputMaybe<Array<SessionCompletedGatesCompletedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesCompletedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesFilters = {
  OR?: InputMaybe<Array<SessionCompletedGatesFiltersOr>>;
  completedAt?: InputMaybe<SessionCompletedGatesCompletedAtFilters>;
  gateId?: InputMaybe<SessionCompletedGatesGateIdFilters>;
  id?: InputMaybe<SessionCompletedGatesIdFilters>;
  sessionProgressId?: InputMaybe<SessionCompletedGatesSessionProgressIdFilters>;
};

export type SessionCompletedGatesFiltersOr = {
  completedAt?: InputMaybe<SessionCompletedGatesCompletedAtFilters>;
  gateId?: InputMaybe<SessionCompletedGatesGateIdFilters>;
  id?: InputMaybe<SessionCompletedGatesIdFilters>;
  sessionProgressId?: InputMaybe<SessionCompletedGatesSessionProgressIdFilters>;
};

export type SessionCompletedGatesGateIdFilters = {
  OR?: InputMaybe<Array<SessionCompletedGatesGateIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesGateIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionCompletedGatesGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionCompletedGatesGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionCompletedGatesGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionCompletedGatesGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionCompletedGatesGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionCompletedGatesGateRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionCompletedGatesGateRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionCompletedGatesGateRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  completedGates: Array<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationCompletedGatesRelation>;
  currentGate: Maybe<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationCurrentGateRelation>;
  currentGateId: Maybe<Scalars['String']['output']>;
  gateClues: Array<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationGateCluesRelation>;
  id: Scalars['String']['output'];
  program: Maybe<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationProgramRelation>;
  programId: Scalars['String']['output'];
  rateLimits: Array<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationRateLimitsRelation>;
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationCompletedGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SessionCompletedGatesOrderBy>;
  where?: InputMaybe<SessionCompletedGatesFilters>;
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationCurrentGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationRateLimitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ClueRateLimitsOrderBy>;
  where?: InputMaybe<ClueRateLimitsFilters>;
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationCompletedGatesRelation = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationCurrentGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationRateLimitsRelation = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgress: Maybe<SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionCompletedGatesGateRelationGateCluesRelationSessionProgressRelationRateLimitsRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionCompletedGatesGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionCompletedGatesGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionCompletedGatesGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionCompletedGatesGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesIdFilters = {
  OR?: InputMaybe<Array<SessionCompletedGatesIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesInsertInput = {
  /** Date */
  completedAt?: InputMaybe<Scalars['String']['input']>;
  gateId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  sessionProgressId: Scalars['String']['input'];
};

export type SessionCompletedGatesItem = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type SessionCompletedGatesOrderBy = {
  completedAt?: InputMaybe<InnerOrder>;
  gateId?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  sessionProgressId?: InputMaybe<InnerOrder>;
};

export type SessionCompletedGatesSelectItem = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gate: Maybe<SessionCompletedGatesGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionCompletedGatesSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionCompletedGatesSelectItemGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionCompletedGatesSelectItemSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionCompletedGatesSessionProgressIdFilters = {
  OR?: InputMaybe<Array<SessionCompletedGatesSessionProgressIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesSessionProgressIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionCompletedGatesSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  completedGates: Array<SessionCompletedGatesSessionProgressRelationCompletedGatesRelation>;
  currentGate: Maybe<SessionCompletedGatesSessionProgressRelationCurrentGateRelation>;
  currentGateId: Maybe<Scalars['String']['output']>;
  gateClues: Array<SessionCompletedGatesSessionProgressRelationGateCluesRelation>;
  id: Scalars['String']['output'];
  program: Maybe<SessionCompletedGatesSessionProgressRelationProgramRelation>;
  programId: Scalars['String']['output'];
  rateLimits: Array<SessionCompletedGatesSessionProgressRelationRateLimitsRelation>;
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationCompletedGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SessionCompletedGatesOrderBy>;
  where?: InputMaybe<SessionCompletedGatesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationCurrentGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};


export type SessionCompletedGatesSessionProgressRelationRateLimitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ClueRateLimitsOrderBy>;
  where?: InputMaybe<ClueRateLimitsFilters>;
};

export type SessionCompletedGatesSessionProgressRelationCompletedGatesRelation = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationCurrentGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionCompletedGatesSessionProgressRelationCurrentGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionCompletedGatesSessionProgressRelationCurrentGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionCompletedGatesSessionProgressRelationCurrentGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionCompletedGatesSessionProgressRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionCompletedGatesSessionProgressRelationGateCluesRelationGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationProgramRelationGatesRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type SessionCompletedGatesSessionProgressRelationRateLimitsRelation = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgress: Maybe<SessionCompletedGatesSessionProgressRelationRateLimitsRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionCompletedGatesSessionProgressRelationRateLimitsRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionCompletedGatesSessionProgressRelationRateLimitsRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionCompletedGatesUpdateInput = {
  /** Date */
  completedAt?: InputMaybe<Scalars['String']['input']>;
  gateId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  sessionProgressId?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressAttemptCountFilters = {
  OR?: InputMaybe<Array<SessionProgressAttemptCountfiltersOr>>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressAttemptCountfiltersOr = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Int']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressCompletedAtFilters = {
  OR?: InputMaybe<Array<SessionProgressCompletedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressCompletedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressCompletedGatesRelation = {
  /** Date */
  completedAt: Scalars['String']['output'];
  gate: Maybe<SessionProgressCompletedGatesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionProgressCompletedGatesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionProgressCompletedGatesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionProgressCompletedGatesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionProgressCompletedGatesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionProgressCompletedGatesRelationGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionProgressCompletedGatesRelationGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionProgressCompletedGatesRelationGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionProgressCompletedGatesRelationGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionProgressCompletedGatesRelationGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionProgressCompletedGatesRelationGateRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionProgressCompletedGatesRelationGateRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionProgressCompletedGatesRelationGateRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionProgressCompletedGatesRelationGateRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionProgressCompletedGatesRelationGateRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionProgressCompletedGatesRelationGateRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionProgressCompletedGatesRelationGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionProgressCompletedGatesRelationGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionProgressCompletedGatesRelationGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionProgressCompletedGatesRelationGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionProgressCompletedGatesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionProgressCurrentGateIdFilters = {
  OR?: InputMaybe<Array<SessionProgressCurrentGateIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressCurrentGateIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressCurrentGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionProgressCurrentGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionProgressCurrentGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionProgressCurrentGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionProgressCurrentGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionProgressCurrentGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionProgressCurrentGateRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionProgressCurrentGateRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionProgressCurrentGateRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionProgressCurrentGateRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionProgressCurrentGateRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionProgressCurrentGateRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionProgressCurrentGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionProgressCurrentGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionProgressCurrentGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionProgressCurrentGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionProgressFilters = {
  OR?: InputMaybe<Array<SessionProgressFiltersOr>>;
  attemptCount?: InputMaybe<SessionProgressAttemptCountFilters>;
  completedAt?: InputMaybe<SessionProgressCompletedAtFilters>;
  currentGateId?: InputMaybe<SessionProgressCurrentGateIdFilters>;
  id?: InputMaybe<SessionProgressIdFilters>;
  programId?: InputMaybe<SessionProgressProgramIdFilters>;
  sessionId?: InputMaybe<SessionProgressSessionIdFilters>;
  startedAt?: InputMaybe<SessionProgressStartedAtFilters>;
  status?: InputMaybe<SessionProgressStatusFilters>;
  updatedAt?: InputMaybe<SessionProgressUpdatedAtFilters>;
};

export type SessionProgressFiltersOr = {
  attemptCount?: InputMaybe<SessionProgressAttemptCountFilters>;
  completedAt?: InputMaybe<SessionProgressCompletedAtFilters>;
  currentGateId?: InputMaybe<SessionProgressCurrentGateIdFilters>;
  id?: InputMaybe<SessionProgressIdFilters>;
  programId?: InputMaybe<SessionProgressProgramIdFilters>;
  sessionId?: InputMaybe<SessionProgressSessionIdFilters>;
  startedAt?: InputMaybe<SessionProgressStartedAtFilters>;
  status?: InputMaybe<SessionProgressStatusFilters>;
  updatedAt?: InputMaybe<SessionProgressUpdatedAtFilters>;
};

export type SessionProgressGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionProgressGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionProgressGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionProgressGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionProgressGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionProgressGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionProgressGateCluesRelationGateRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionProgressGateCluesRelationGateRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionProgressGateCluesRelationGateRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionProgressGateCluesRelationGateRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionProgressGateCluesRelationGateRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgressId: Scalars['String']['output'];
};

export type SessionProgressGateCluesRelationGateRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionProgressGateCluesRelationGateRelationProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionProgressGateCluesRelationGateRelationProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionProgressGateCluesRelationGateRelationProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionProgressGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionProgressIdFilters = {
  OR?: InputMaybe<Array<SessionProgressIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressInsertInput = {
  attemptCount?: InputMaybe<Scalars['Int']['input']>;
  /** Date */
  completedAt?: InputMaybe<Scalars['String']['input']>;
  currentGateId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  programId: Scalars['String']['input'];
  sessionId: Scalars['String']['input'];
  /** Date */
  startedAt?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  updatedAt?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressItem = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionProgressOrderBy = {
  attemptCount?: InputMaybe<InnerOrder>;
  completedAt?: InputMaybe<InnerOrder>;
  currentGateId?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  programId?: InputMaybe<InnerOrder>;
  sessionId?: InputMaybe<InnerOrder>;
  startedAt?: InputMaybe<InnerOrder>;
  status?: InputMaybe<InnerOrder>;
  updatedAt?: InputMaybe<InnerOrder>;
};

export type SessionProgressProgramIdFilters = {
  OR?: InputMaybe<Array<SessionProgressProgramIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressProgramIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  gates: Array<SessionProgressProgramRelationGatesRelation>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};


export type SessionProgressProgramRelationGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GatesOrderBy>;
  where?: InputMaybe<GatesFilters>;
};

export type SessionProgressProgramRelationGatesRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gateClues: Array<SessionProgressProgramRelationGatesRelationGateCluesRelation>;
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  program: Maybe<SessionProgressProgramRelationGatesRelationProgramRelation>;
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};


export type SessionProgressProgramRelationGatesRelationGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionProgressProgramRelationGatesRelationProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};

export type SessionProgressProgramRelationGatesRelationGateCluesRelation = {
  attemptCountAtRequest: Scalars['Int']['output'];
  clueText: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  gate: Maybe<SessionProgressProgramRelationGatesRelationGateCluesRelationGateRelation>;
  gateId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  sessionProgress: Maybe<SessionProgressProgramRelationGatesRelationGateCluesRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionProgressProgramRelationGatesRelationGateCluesRelationGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionProgressProgramRelationGatesRelationGateCluesRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionProgressProgramRelationGatesRelationGateCluesRelationGateRelation = {
  acceptanceThreshold: Scalars['Float']['output'];
  correctAnswer: Scalars['String']['output'];
  /** Date */
  createdAt: Scalars['String']['output'];
  guidanceEnabled: Scalars['Boolean']['output'];
  guidanceThreshold: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  question: Scalars['String']['output'];
  sequenceOrder: Scalars['Int']['output'];
  successMessage: Scalars['String']['output'];
};

export type SessionProgressProgramRelationGatesRelationGateCluesRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionProgressProgramRelationGatesRelationProgramRelation = {
  authorId: Maybe<Scalars['String']['output']>;
  /** Date */
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  visibility: Scalars['String']['output'];
};

export type SessionProgressRateLimitsRelation = {
  attemptCountAtRequest: Maybe<Scalars['Int']['output']>;
  gateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Date */
  requestedAt: Scalars['String']['output'];
  sessionProgress: Maybe<SessionProgressRateLimitsRelationSessionProgressRelation>;
  sessionProgressId: Scalars['String']['output'];
};


export type SessionProgressRateLimitsRelationSessionProgressArgs = {
  where?: InputMaybe<SessionProgressFilters>;
};

export type SessionProgressRateLimitsRelationSessionProgressRelation = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  currentGateId: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  programId: Scalars['String']['output'];
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};

export type SessionProgressSelectItem = {
  attemptCount: Scalars['Int']['output'];
  /** Date */
  completedAt: Maybe<Scalars['String']['output']>;
  completedGates: Array<SessionProgressCompletedGatesRelation>;
  currentGate: Maybe<SessionProgressCurrentGateRelation>;
  currentGateId: Maybe<Scalars['String']['output']>;
  gateClues: Array<SessionProgressGateCluesRelation>;
  id: Scalars['String']['output'];
  program: Maybe<SessionProgressProgramRelation>;
  programId: Scalars['String']['output'];
  rateLimits: Array<SessionProgressRateLimitsRelation>;
  sessionId: Scalars['String']['output'];
  /** Date */
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  /** Date */
  updatedAt: Scalars['String']['output'];
};


export type SessionProgressSelectItemCompletedGatesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SessionCompletedGatesOrderBy>;
  where?: InputMaybe<SessionCompletedGatesFilters>;
};


export type SessionProgressSelectItemCurrentGateArgs = {
  where?: InputMaybe<GatesFilters>;
};


export type SessionProgressSelectItemGateCluesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<GateCluesOrderBy>;
  where?: InputMaybe<GateCluesFilters>;
};


export type SessionProgressSelectItemProgramArgs = {
  where?: InputMaybe<ProgramsFilters>;
};


export type SessionProgressSelectItemRateLimitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ClueRateLimitsOrderBy>;
  where?: InputMaybe<ClueRateLimitsFilters>;
};

export type SessionProgressSessionIdFilters = {
  OR?: InputMaybe<Array<SessionProgressSessionIdfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressSessionIdfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressStartedAtFilters = {
  OR?: InputMaybe<Array<SessionProgressStartedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressStartedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressStatusFilters = {
  OR?: InputMaybe<Array<SessionProgressStatusfiltersOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressStatusfiltersOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressUpdateInput = {
  attemptCount?: InputMaybe<Scalars['Int']['input']>;
  /** Date */
  completedAt?: InputMaybe<Scalars['String']['input']>;
  currentGateId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  programId?: InputMaybe<Scalars['String']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  startedAt?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  updatedAt?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressUpdatedAtFilters = {
  OR?: InputMaybe<Array<SessionProgressUpdatedAtfiltersOr>>;
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SessionProgressUpdatedAtfiltersOr = {
  /** Date */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Date */
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<Date> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SubmitGuessPayload = {
  canRequestClue: Scalars['Boolean']['output'];
  message: Maybe<Scalars['String']['output']>;
  nextGate: Maybe<ActiveGate>;
  success: Scalars['Boolean']['output'];
};

export type SubmitGuessMutationVariables = Exact<{
  programId: string;
  gateId: string;
  guess: string;
}>;


export type SubmitGuessMutation = { submitGuess: { success: boolean, message: string | null, canRequestClue: boolean, nextGate: { id: string, label: string, question: string } | null } | null };

export type RequestClueMutationVariables = Exact<{
  programId: string;
  gateId: string;
  currentGuess: string;
}>;


export type RequestClueMutation = { requestClue: { clueText: string | null, isClueLimitReached: boolean, cluesRemaining: number, isRateLimited: boolean, retryAfterMs: number | null, isAiBudgetExhausted: boolean } | null };

export type ResetSessionMutationVariables = Exact<{
  programId: string;
}>;


export type ResetSessionMutation = { resetSession: boolean };

export type GetProgramsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProgramsQuery = { programs: Array<{ id: string, name: string }> };

export type GetProgramProgressionQueryVariables = Exact<{
  programId: string;
}>;


export type GetProgramProgressionQuery = { getProgramProgression: { status: string, currentGate: { id: string, label: string, question: string } | null, completedGates: Array<{ id: string, label: string, question: string, correctAnswer: string, successMessage: string }> } | null };

export type GetInProgressProgramQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInProgressProgramQuery = { getInProgressProgram: string | null };

export type ProgramQueryVariables = Exact<{
  id: string;
}>;


export type ProgramQuery = { program: { id: string, name: string } | null };

export type ProgramGatesQueryVariables = Exact<{
  programId: string;
}>;


export type ProgramGatesQuery = { programGates: Array<{ id: string, programId: string, sequenceOrder: number, label: string, question: string, correctAnswer: string, successMessage: string, acceptanceThreshold: number, guidanceEnabled: boolean, guidanceThreshold: number }> };

export type MyProgramsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyProgramsQuery = { myPrograms: Array<{ id: string, name: string, visibility: string, authorId: string | null } | null> | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, name: string, image: string | null } | null };

export type CreateProgramMutationVariables = Exact<{
  name: string;
  visibility?: string | null | undefined;
}>;


export type CreateProgramMutation = { createProgram: { id: string, name: string, visibility: string, authorId: string | null, createdAt: string } | null };

export type UpdateProgramMutationVariables = Exact<{
  id: string;
  name?: string | null | undefined;
  visibility?: string | null | undefined;
}>;


export type UpdateProgramMutation = { updateProgram: { id: string, name: string, visibility: string } | null };

export type DeleteProgramMutationVariables = Exact<{
  id: string;
}>;


export type DeleteProgramMutation = { deleteProgram: boolean };

export type CreateGateMutationVariables = Exact<{
  programId: string;
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
  sequenceOrder: number;
  acceptanceThreshold?: number | null | undefined;
  guidanceEnabled?: boolean | null | undefined;
  guidanceThreshold?: number | null | undefined;
}>;


export type CreateGateMutation = { createGate: { id: string, programId: string, label: string, question: string, sequenceOrder: number } | null };

export type UpdateGateMutationVariables = Exact<{
  id: string;
  label?: string | null | undefined;
  question?: string | null | undefined;
  correctAnswer?: string | null | undefined;
  successMessage?: string | null | undefined;
  sequenceOrder?: number | null | undefined;
  acceptanceThreshold?: number | null | undefined;
  guidanceEnabled?: boolean | null | undefined;
  guidanceThreshold?: number | null | undefined;
}>;


export type UpdateGateMutation = { updateGate: { id: string, label: string, sequenceOrder: number } | null };

export type DeleteGateMutationVariables = Exact<{
  id: string;
}>;


export type DeleteGateMutation = { deleteGate: boolean };

export type ReorderGatesMutationVariables = Exact<{
  programId: string;
  orderedGateIds: Array<string> | string;
}>;


export type ReorderGatesMutation = { reorderGates: boolean };


export const SubmitGuessDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitGuess"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"programId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"gateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guess"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitGuess"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"programId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"programId"}}},{"kind":"Argument","name":{"kind":"Name","value":"gateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"gateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"guess"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guess"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"canRequestClue"}},{"kind":"Field","name":{"kind":"Name","value":"nextGate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"question"}}]}}]}}]}}]} as unknown as DocumentNode<SubmitGuessMutation, SubmitGuessMutationVariables>;
export const RequestClueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestClue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"programId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"gateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentGuess"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestClue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"programId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"programId"}}},{"kind":"Argument","name":{"kind":"Name","value":"gateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"gateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"currentGuess"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentGuess"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clueText"}},{"kind":"Field","name":{"kind":"Name","value":"isClueLimitReached"}},{"kind":"Field","name":{"kind":"Name","value":"cluesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"isRateLimited"}},{"kind":"Field","name":{"kind":"Name","value":"retryAfterMs"}},{"kind":"Field","name":{"kind":"Name","value":"isAiBudgetExhausted"}}]}}]}}]} as unknown as DocumentNode<RequestClueMutation, RequestClueMutationVariables>;
export const ResetSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"programId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"programId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"programId"}}}]}]}}]} as unknown as DocumentNode<ResetSessionMutation, ResetSessionMutationVariables>;
export const GetProgramsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPrograms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"programs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetProgramsQuery, GetProgramsQueryVariables>;
export const GetProgramProgressionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProgramProgression"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"programId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getProgramProgression"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"programId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"programId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentGate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"question"}}]}},{"kind":"Field","name":{"kind":"Name","value":"completedGates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"correctAnswer"}},{"kind":"Field","name":{"kind":"Name","value":"successMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<GetProgramProgressionQuery, GetProgramProgressionQueryVariables>;
export const GetInProgressProgramDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInProgressProgram"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getInProgressProgram"}}]}}]} as unknown as DocumentNode<GetInProgressProgramQuery, GetInProgressProgramQueryVariables>;
export const ProgramDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Program"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"program"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProgramQuery, ProgramQueryVariables>;
export const ProgramGatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProgramGates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"programId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"programGates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"programId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"programId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"programId"}},{"kind":"Field","name":{"kind":"Name","value":"sequenceOrder"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"correctAnswer"}},{"kind":"Field","name":{"kind":"Name","value":"successMessage"}},{"kind":"Field","name":{"kind":"Name","value":"acceptanceThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceThreshold"}}]}}]}}]} as unknown as DocumentNode<ProgramGatesQuery, ProgramGatesQueryVariables>;
export const MyProgramsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPrograms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPrograms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}}]}}]}}]} as unknown as DocumentNode<MyProgramsQuery, MyProgramsQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const CreateProgramDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProgram"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProgram"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"visibility"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateProgramMutation, CreateProgramMutationVariables>;
export const UpdateProgramDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProgram"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProgram"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"visibility"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]} as unknown as DocumentNode<UpdateProgramMutation, UpdateProgramMutationVariables>;
export const DeleteProgramDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProgram"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProgram"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProgramMutation, DeleteProgramMutationVariables>;
export const CreateGateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"programId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"label"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"question"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"correctAnswer"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"successMessage"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sequenceOrder"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"acceptanceThreshold"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceEnabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceThreshold"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"programId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"programId"}}},{"kind":"Argument","name":{"kind":"Name","value":"label"},"value":{"kind":"Variable","name":{"kind":"Name","value":"label"}}},{"kind":"Argument","name":{"kind":"Name","value":"question"},"value":{"kind":"Variable","name":{"kind":"Name","value":"question"}}},{"kind":"Argument","name":{"kind":"Name","value":"correctAnswer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"correctAnswer"}}},{"kind":"Argument","name":{"kind":"Name","value":"successMessage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"successMessage"}}},{"kind":"Argument","name":{"kind":"Name","value":"sequenceOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sequenceOrder"}}},{"kind":"Argument","name":{"kind":"Name","value":"acceptanceThreshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"acceptanceThreshold"}}},{"kind":"Argument","name":{"kind":"Name","value":"guidanceEnabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceEnabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"guidanceThreshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceThreshold"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"programId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"sequenceOrder"}}]}}]}}]} as unknown as DocumentNode<CreateGateMutation, CreateGateMutationVariables>;
export const UpdateGateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"label"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"question"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"correctAnswer"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"successMessage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sequenceOrder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"acceptanceThreshold"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceEnabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceThreshold"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"label"},"value":{"kind":"Variable","name":{"kind":"Name","value":"label"}}},{"kind":"Argument","name":{"kind":"Name","value":"question"},"value":{"kind":"Variable","name":{"kind":"Name","value":"question"}}},{"kind":"Argument","name":{"kind":"Name","value":"correctAnswer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"correctAnswer"}}},{"kind":"Argument","name":{"kind":"Name","value":"successMessage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"successMessage"}}},{"kind":"Argument","name":{"kind":"Name","value":"sequenceOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sequenceOrder"}}},{"kind":"Argument","name":{"kind":"Name","value":"acceptanceThreshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"acceptanceThreshold"}}},{"kind":"Argument","name":{"kind":"Name","value":"guidanceEnabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceEnabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"guidanceThreshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceThreshold"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sequenceOrder"}}]}}]}}]} as unknown as DocumentNode<UpdateGateMutation, UpdateGateMutationVariables>;
export const DeleteGateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGateMutation, DeleteGateMutationVariables>;
export const ReorderGatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderGates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"programId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderedGateIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderGates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"programId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"programId"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderedGateIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderedGateIds"}}}]}]}}]} as unknown as DocumentNode<ReorderGatesMutation, ReorderGatesMutationVariables>;