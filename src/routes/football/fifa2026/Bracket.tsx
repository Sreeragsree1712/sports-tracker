import { useMemo } from 'react';
import { fixtures, results, groups } from '../../../data/fifa2026';
import { computeAllStandings } from '../../../lib/standings';
import { resolveBracket } from '../../../lib/bracket';
import BracketView from '../../../components/shared/Bracket';

export default function BracketRoute() {
  const standings = useMemo(
    () => computeAllStandings(groups, fixtures, results),
    [],
  );
  const resolved = useMemo(
    () => resolveBracket(fixtures, results, standings),
    [standings],
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Knockout bracket</h2>
        <p className="text-xs text-slate-400 mt-1">
          Placeholders like <span className="italic">1A</span> (Group A winner) and
          <span className="italic"> 3rd ABCDF</span> (best 3rd-placed team from those groups)
          fill in automatically as group results arrive.
        </p>
      </div>
      <BracketView fixtures={fixtures} results={results} resolved={resolved} />
    </div>
  );
}
