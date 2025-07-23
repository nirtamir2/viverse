import { Euler, Quaternion } from 'three'
import { loadVrmCharacterModel } from './vrm.js'
import { cached, clearCache } from '../utils.js'
import { loadGltfCharacterModel } from './gltf.js'

export { VRMHumanBoneName } from '@pixiv/three-vrm'
export * from './vrm.js'

export type CharacterModelOptions =
  | {
      readonly type?: 'vrm' | 'gltf'
      readonly url?: string
      /**
       * allows to apply an rotation offset when placing objects as children of the character's bones
       * @default undefined
       */
      readonly boneRotationOffset?: Quaternion
      /**
       * @default true
       */
      readonly castShadow?: boolean
      /**
       * @default true
       */
      readonly receiveShadow?: boolean
    }
  | boolean

async function uncachedLoadCharacterModel(
  type: Exclude<CharacterModelOptions, boolean>['type'],
  url?: string,
  boneRotationOffset?: Quaternion,
  castShadow: boolean = true,
  receiveShadow: boolean = true,
) {
  let result: Awaited<ReturnType<typeof loadVrmCharacterModel | typeof loadGltfCharacterModel>> & {
    boneRotationOffset?: Quaternion
  }

  if (type == null || url == null) {
    //prepare loading the default model
    type = 'gltf'
    url = (await import('../assets/mannequin.js')).url
    boneRotationOffset = new Quaternion().setFromEuler(new Euler(Math.PI, 0, Math.PI / 2, 'ZYX'))
  }
  switch (type) {
    case 'vrm':
      result = await loadVrmCharacterModel(url)
      break
    case 'gltf':
      result = await loadGltfCharacterModel(url)
      break
  }
  result.boneRotationOffset = boneRotationOffset
  result.scene.traverse((obj) => {
    obj.frustumCulled = false
    if (castShadow) {
      obj.castShadow = true
    }
    if (receiveShadow) {
      obj.receiveShadow = true
    }
  })
  return result
}

function getCharacterModelDependencies(
  options: CharacterModelOptions = true,
): Parameters<typeof uncachedLoadCharacterModel> | undefined {
  if (options === false) {
    return undefined
  }
  if (options === true) {
    return [undefined, undefined, undefined, undefined, undefined]
  }
  return [options.type, options.url, options.boneRotationOffset, options.castShadow, options.receiveShadow] as const
}

export function clearCharacterModelCache(options?: CharacterModelOptions) {
  const dependencies = getCharacterModelDependencies(options)
  if (dependencies == null) {
    return
  }
  clearCache(uncachedLoadCharacterModel, dependencies)
}

export function loadCharacterModel(options?: CharacterModelOptions) {
  const dependencies = getCharacterModelDependencies(options)
  if (dependencies == null) {
    return undefined
  }
  return cached(uncachedLoadCharacterModel, dependencies as any)
}
