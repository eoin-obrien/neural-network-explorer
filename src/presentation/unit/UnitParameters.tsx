import type { Dispatch, ReactElement } from 'react';

import type { ExplorerAction } from '../../application/explorer/explorerReducer';
import { ParameterSlider } from '../controls/ParameterSlider';
import { phiRange, thetaBiasRange, thetaWeightRange } from '../controls/parameterRanges';
import { subscript } from '../notation/notation';
import type { UnitCardModel } from './unitCards';

interface UnitParametersProps {
  readonly card: UnitCardModel;
  readonly dispatch: Dispatch<ExplorerAction>;
}

/** Every trainable parameter this unit owns, plus the phi that reads it. */
export function UnitParameters({ card, dispatch }: UnitParametersProps): ReactElement {
  return (
    <>
      <ParameterSlider
        symbol={card.thetaBias.symbol}
        description={card.thetaBias.description}
        value={card.thetaBias.value}
        range={thetaBiasRange}
        onChange={(value) => {
          dispatch({ type: 'setThetaBias', unitId: card.unitId, value });
        }}
      />
      {card.theta.map((control) => (
        <ParameterSlider
          key={control.sourceId}
          symbol={control.symbol}
          description={control.description}
          value={control.value}
          range={thetaWeightRange}
          onChange={(value) => {
            dispatch({ type: 'setTheta', unitId: card.unitId, sourceId: control.sourceId, value });
          }}
        />
      ))}
      {/* Empty for a unit the output does not read, which is every unit that is
          not in the last hidden layer. */}
      {card.phi.map((phi) => (
        <ParameterSlider
          key={phi.sourceId}
          symbol={`φ${subscript([card.number])}`}
          description="output weight"
          value={phi.value}
          range={phiRange}
          onChange={(value) => {
            dispatch({ type: 'setPhi', sourceId: phi.sourceId, value });
          }}
        />
      ))}
    </>
  );
}
