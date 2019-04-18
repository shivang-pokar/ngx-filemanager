import { Bucket, File } from '../../types/google-cloud-types';
import { EnsureNoPrefixSlash } from '../../utils/path-helpers';
import { GetAllChildrenWithPrefix } from '../../utils/storage-helper';
import { UserCustomClaims, ResultObj } from 'ngx-filemanager-core/public_api';
import { VError } from 'verror';

export async function tryDeleteFile(file: File): Promise<boolean> {
  try {
    const [exists] = await file.exists();
    if (exists) {
      console.log('- deleting file: ', file.name);
      await file.delete();
      return true;
    }
    return false;
  } catch (error) {
    throw new VError(error);
  }
}

export async function RemoveFileWithChildren(
  bucket: Bucket,
  itemPath: string
): Promise<boolean> {
  try {
    const allChildren = await GetAllChildrenWithPrefix(bucket, itemPath);
    const successArray = await Promise.all(
      allChildren.map(f => tryDeleteFile(f))
    );
    const allSuccesses = successArray.reduce(
      (acc, cur) => (acc = acc && cur),
      true
    );
    return allSuccesses;
  } catch (error) {
    throw new VError(error);
  }
}

export async function RemoveFiles(
  bucket: Bucket,
  items: string[],
  claims: UserCustomClaims
) {
  try {
    const googleStorageItemPaths = items.map(p => EnsureNoPrefixSlash(p));
    const successArray = await Promise.all(
      googleStorageItemPaths.map(itemPath =>
        RemoveFileWithChildren(bucket, itemPath)
      )
    );
    const allSuccesses = successArray.reduce(
      (acc, cur) => (acc = acc && cur),
      true
    );
    const results: ResultObj = {
      success: allSuccesses
    };
    return results;
  } catch (error) {
    throw new VError(error);
  }
}
