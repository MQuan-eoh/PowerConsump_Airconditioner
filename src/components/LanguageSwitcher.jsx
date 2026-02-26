import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
        onClick={() => i18n.changeLanguage("en")}
      >
        EN
      </button>
      <button
        className={`lang-btn ${i18n.language === "vi" ? "active" : ""}`}
        onClick={() => i18n.changeLanguage("vi")}
      >
        VI
      </button>
    </div>
  );
};

export default LanguageSwitcher;
