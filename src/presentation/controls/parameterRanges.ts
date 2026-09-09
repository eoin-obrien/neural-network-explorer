/** Slider bounds for a teaching control. The domain accepts any finite value. */
export interface ControlRange {
  readonly min: number;
  readonly max: number;
}

// These bound the controls, not the mathematics: they are chosen so a learner
// sweeping a slider stays in a range where the plots remain readable.
export const thetaBiasRange: ControlRange = { min: -2, max: 2 };
export const thetaWeightRange: ControlRange = { min: -3, max: 3 };
export const phiRange: ControlRange = { min: -3, max: 3 };
export const phi0Range: ControlRange = { min: -2, max: 2 };

export const parameterStep = 0.05;
