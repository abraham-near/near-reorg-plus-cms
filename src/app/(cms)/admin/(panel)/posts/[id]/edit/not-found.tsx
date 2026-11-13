import { CmsNotFoundView } from '@/cms/components/CmsErrorView'

export default function PostNotFound() {
  return <CmsNotFoundView title="This post no longer exists" detail="It may have been deleted. Its revisions went with it." />
}
