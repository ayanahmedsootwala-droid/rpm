/**
 * Sample Page
 */

import PageMeta from "../components/common/PageMeta";
import { useLanguage } from '@/contexts/LanguageContext';

export default function SamplePage() {
  const { t } = useLanguage();
  return (
    <>
      <PageMeta title="Home" description="Home Page Introduction" />
      <div>
        <h3>This is a sample page</h3>
      </div>
    </>
  );
}
