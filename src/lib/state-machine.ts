import { AppError } from './errors';

/**
 * Party that causes a transition. Fine-grained role permissions are checked by the
 * application layer (RBAC); this is the coarse rule that must hold regardless of RBAC config.
 */
export type ActorKind = 'CUSTOMER' | 'PROVIDER' | 'PLATFORM' | 'SYSTEM';

export interface TransitionRule {
  actors: readonly ActorKind[];
  /** Exception paths must record a human-readable reason. */
  requiresReason?: boolean;
}

export type TransitionTable<S extends string> = Partial<
  Record<S, Partial<Record<S, TransitionRule>>>
>;

export interface Actor {
  kind: ActorKind;
  /** User id; null only for SYSTEM. */
  id: string | null;
}

export interface ValidatedTransition<S extends string> {
  from: S;
  to: S;
  actor: Actor;
  reason: string | null;
}

export function createStateMachine<S extends string>(entity: string, table: TransitionTable<S>) {
  const ruleFor = (from: S, to: S) => table[from]?.[to];

  return {
    canTransition(from: S, to: S, actor: ActorKind): boolean {
      return ruleFor(from, to)?.actors.includes(actor) ?? false;
    },

    allowedNext(from: S, actor: ActorKind): S[] {
      const rules: Partial<Record<S, TransitionRule>> = table[from] ?? {};
      return (Object.keys(rules) as S[]).filter((to) => rules[to]?.actors.includes(actor));
    },

    /** Throws an AppError unless the move is allowed for this actor (and has a reason if required). */
    validate(from: S, to: S, actor: Actor, reason?: string | null): ValidatedTransition<S> {
      const rule = ruleFor(from, to);
      if (!rule) {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          `This ${entity} cannot move to the requested status.`,
          { entity, from, to },
        );
      }
      if (!rule.actors.includes(actor.kind)) {
        throw new AppError('FORBIDDEN', `You are not allowed to perform this ${entity} action.`, {
          entity,
          from,
          to,
          actorKind: actor.kind,
        });
      }
      if (actor.kind !== 'SYSTEM' && !actor.id) {
        throw new AppError('AUTH_REQUIRED', 'An authenticated actor is required.');
      }
      const trimmed = reason?.trim() || null;
      if (rule.requiresReason && !trimmed) {
        throw new AppError('VALIDATION_ERROR', 'A reason is required for this status change.', {
          entity,
          to,
        });
      }
      return { from, to, actor, reason: trimmed };
    },
  };
}
