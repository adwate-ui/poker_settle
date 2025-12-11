// Card back design hook - simplified to always use classic design
// Removed user_preferences table dependency to avoid database errors

export type CardBackDesign = 'classic';

export const useCardBackDesign = () => {
  // Always use classic design, no database lookups
  const design: CardBackDesign = 'classic';
  const loading = false;

  const updateDesign = async (_newDesign: CardBackDesign) => {
    // No-op: design is always classic now
    return;
  };

  return { design, setDesign: updateDesign, loading };
};
