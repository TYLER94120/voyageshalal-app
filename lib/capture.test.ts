import { isValidEmail } from './capture';

describe('isValidEmail', () => {
  it('accepte des e-mails corrects', () => {
    expect(isValidEmail('a@b.fr')).toBe(true);
    expect(isValidEmail('oulali.mohamed@gmail.com')).toBe(true);
  });
  it('rejette les invalides', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('abc')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a@@b.fr')).toBe(false);
    expect(isValidEmail('a b@c.fr')).toBe(false);
    expect(isValidEmail('@b.fr')).toBe(false);
    expect(isValidEmail('a@.fr')).toBe(false);
    expect(isValidEmail('a@b.')).toBe(false);
  });
});
