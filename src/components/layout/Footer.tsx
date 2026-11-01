import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, Linkedin, Mail, Shield } from 'lucide-react';
import { settingsService } from '../../services/storage';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export const Footer: React.FC = () => {
  const settings = settingsService.get();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[#07090d] text-slate-400 pt-16 pb-28 md:pb-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Studio info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold font-display text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Horvát László</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Ötletből működő digitális projekt. Egyedi weboldalak, modern webalkalmazások és szoftverek fejlesztése a tervezéstől a megvalósításig.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {settings.socialLinks?.github && (
                <a
                  href={settings.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.linkedin && (
                <a
                  href={settings.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              <a
                href={`mailto:${settings.email}`}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="E-mail"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Navigáció</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Főoldal</Link>
              </li>
              <li>
                <Link to="/rolam" className="hover:text-white transition-colors">Rólam</Link>
              </li>
              <li>
                <Link to="/szolgaltatasok" className="hover:text-white transition-colors">Szolgáltatások</Link>
              </li>
              <li>
                <Link to="/projektek" className="hover:text-white transition-colors">Projektek</Link>
              </li>
              <li>
                <Link to="/letoltesek" className="hover:text-white transition-colors">Letöltések</Link>
              </li>
              <li>
                <Link to="/kapcsolat" className="hover:text-white transition-colors">Kapcsolat</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct contact & Studio CTA */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Projektindítás</h4>
            <p className="text-xs text-slate-400 mb-3">
              Van egy konkrét elképzelésed vagy új ötleted? Küldd el a részleteket!
            </p>
            <Link
              to="/projekt-igeny"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group mb-4"
            >
              <span>Projektigény beküldése</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <div className="pt-2 text-xs text-slate-400 space-y-3">
              <div>
                <span className="block text-slate-300">{settings.email}</span>
                <span className="block">{settings.location}</span>
              </div>
              <PWAInstallButton variant="footer" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {currentYear} Horvát László – Web & Project Studio. Minden jog fenntartva.</p>
          <div className="flex items-center gap-4">
            <span>Webdesigner • Webfejlesztő • Projektkészítő</span>
            <span aria-hidden="true">·</span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Adminisztráció</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
