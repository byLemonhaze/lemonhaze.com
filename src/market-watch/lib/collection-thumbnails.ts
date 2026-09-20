import thumbnails from './collection-thumbnails.json';
import type {Collection} from './types';
type Thumbnail={id:string;name:string;role:string;src:string;source:string};
const indexed:Record<string,Thumbnail>=thumbnails;
export function collectionThumbnail(collection:Pick<Collection,'key'>):Thumbnail|null {
    return indexed[collection.key] || null;
}
