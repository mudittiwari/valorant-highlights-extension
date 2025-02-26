var content = function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  var _a, _b, _c, _d;
  function defineContentScript(definition2) {
    return definition2;
  }
  var has = Object.prototype.hasOwnProperty;
  function dequal(foo, bar) {
    var ctor, len;
    if (foo === bar) return true;
    if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
      if (ctor === Date) return foo.getTime() === bar.getTime();
      if (ctor === RegExp) return foo.toString() === bar.toString();
      if (ctor === Array) {
        if ((len = foo.length) === bar.length) {
          while (len-- && dequal(foo[len], bar[len])) ;
        }
        return len === -1;
      }
      if (!ctor || typeof foo === "object") {
        len = 0;
        for (ctor in foo) {
          if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
          if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
        }
        return Object.keys(bar).length === len;
      }
    }
    return foo !== foo && bar !== bar;
  }
  const E_CANCELED = new Error("request for lock canceled");
  var __awaiter$2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result2) {
        result2.done ? resolve(result2.value) : adopt(result2.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  class Semaphore {
    constructor(_value, _cancelError = E_CANCELED) {
      this._value = _value;
      this._cancelError = _cancelError;
      this._queue = [];
      this._weightedWaiters = [];
    }
    acquire(weight = 1, priority = 0) {
      if (weight <= 0)
        throw new Error(`invalid weight ${weight}: must be positive`);
      return new Promise((resolve, reject) => {
        const task = { resolve, reject, weight, priority };
        const i = findIndexFromEnd(this._queue, (other) => priority <= other.priority);
        if (i === -1 && weight <= this._value) {
          this._dispatchItem(task);
        } else {
          this._queue.splice(i + 1, 0, task);
        }
      });
    }
    runExclusive(callback_1) {
      return __awaiter$2(this, arguments, void 0, function* (callback, weight = 1, priority = 0) {
        const [value, release] = yield this.acquire(weight, priority);
        try {
          return yield callback(value);
        } finally {
          release();
        }
      });
    }
    waitForUnlock(weight = 1, priority = 0) {
      if (weight <= 0)
        throw new Error(`invalid weight ${weight}: must be positive`);
      if (this._couldLockImmediately(weight, priority)) {
        return Promise.resolve();
      } else {
        return new Promise((resolve) => {
          if (!this._weightedWaiters[weight - 1])
            this._weightedWaiters[weight - 1] = [];
          insertSorted(this._weightedWaiters[weight - 1], { resolve, priority });
        });
      }
    }
    isLocked() {
      return this._value <= 0;
    }
    getValue() {
      return this._value;
    }
    setValue(value) {
      this._value = value;
      this._dispatchQueue();
    }
    release(weight = 1) {
      if (weight <= 0)
        throw new Error(`invalid weight ${weight}: must be positive`);
      this._value += weight;
      this._dispatchQueue();
    }
    cancel() {
      this._queue.forEach((entry) => entry.reject(this._cancelError));
      this._queue = [];
    }
    _dispatchQueue() {
      this._drainUnlockWaiters();
      while (this._queue.length > 0 && this._queue[0].weight <= this._value) {
        this._dispatchItem(this._queue.shift());
        this._drainUnlockWaiters();
      }
    }
    _dispatchItem(item) {
      const previousValue = this._value;
      this._value -= item.weight;
      item.resolve([previousValue, this._newReleaser(item.weight)]);
    }
    _newReleaser(weight) {
      let called = false;
      return () => {
        if (called)
          return;
        called = true;
        this.release(weight);
      };
    }
    _drainUnlockWaiters() {
      if (this._queue.length === 0) {
        for (let weight = this._value; weight > 0; weight--) {
          const waiters = this._weightedWaiters[weight - 1];
          if (!waiters)
            continue;
          waiters.forEach((waiter) => waiter.resolve());
          this._weightedWaiters[weight - 1] = [];
        }
      } else {
        const queuedPriority = this._queue[0].priority;
        for (let weight = this._value; weight > 0; weight--) {
          const waiters = this._weightedWaiters[weight - 1];
          if (!waiters)
            continue;
          const i = waiters.findIndex((waiter) => waiter.priority <= queuedPriority);
          (i === -1 ? waiters : waiters.splice(0, i)).forEach((waiter) => waiter.resolve());
        }
      }
    }
    _couldLockImmediately(weight, priority) {
      return (this._queue.length === 0 || this._queue[0].priority < priority) && weight <= this._value;
    }
  }
  function insertSorted(a, v) {
    const i = findIndexFromEnd(a, (other) => v.priority <= other.priority);
    a.splice(i + 1, 0, v);
  }
  function findIndexFromEnd(a, predicate) {
    for (let i = a.length - 1; i >= 0; i--) {
      if (predicate(a[i])) {
        return i;
      }
    }
    return -1;
  }
  var __awaiter$1 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result2) {
        result2.done ? resolve(result2.value) : adopt(result2.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  class Mutex {
    constructor(cancelError) {
      this._semaphore = new Semaphore(1, cancelError);
    }
    acquire() {
      return __awaiter$1(this, arguments, void 0, function* (priority = 0) {
        const [, releaser] = yield this._semaphore.acquire(1, priority);
        return releaser;
      });
    }
    runExclusive(callback, priority = 0) {
      return this._semaphore.runExclusive(() => callback(), 1, priority);
    }
    isLocked() {
      return this._semaphore.isLocked();
    }
    waitForUnlock(priority = 0) {
      return this._semaphore.waitForUnlock(1, priority);
    }
    release() {
      if (this._semaphore.isLocked())
        this._semaphore.release();
    }
    cancel() {
      return this._semaphore.cancel();
    }
  }
  const browser$1 = (
    // @ts-expect-error
    ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  const storage = createStorage();
  function createStorage() {
    const drivers = {
      local: createDriver("local"),
      session: createDriver("session"),
      sync: createDriver("sync"),
      managed: createDriver("managed")
    };
    const getDriver = (area) => {
      const driver = drivers[area];
      if (driver == null) {
        const areaNames = Object.keys(drivers).join(", ");
        throw Error(`Invalid area "${area}". Options: ${areaNames}`);
      }
      return driver;
    };
    const resolveKey = (key) => {
      const deliminatorIndex = key.indexOf(":");
      const driverArea = key.substring(0, deliminatorIndex);
      const driverKey = key.substring(deliminatorIndex + 1);
      if (driverKey == null)
        throw Error(
          `Storage key should be in the form of "area:key", but received "${key}"`
        );
      return {
        driverArea,
        driverKey,
        driver: getDriver(driverArea)
      };
    };
    const getMetaKey = (key) => key + "$";
    const mergeMeta = (oldMeta, newMeta) => {
      const newFields = { ...oldMeta };
      Object.entries(newMeta).forEach(([key, value]) => {
        if (value == null)
          delete newFields[key];
        else
          newFields[key] = value;
      });
      return newFields;
    };
    const getValueOrFallback = (value, fallback) => value ?? fallback ?? null;
    const getMetaValue = (properties) => typeof properties === "object" && !Array.isArray(properties) ? properties : {};
    const getItem = async (driver, driverKey, opts) => {
      const res = await driver.getItem(driverKey);
      return getValueOrFallback(res, (opts == null ? void 0 : opts.fallback) ?? (opts == null ? void 0 : opts.defaultValue));
    };
    const getMeta = async (driver, driverKey) => {
      const metaKey = getMetaKey(driverKey);
      const res = await driver.getItem(metaKey);
      return getMetaValue(res);
    };
    const setItem = async (driver, driverKey, value) => {
      await driver.setItem(driverKey, value ?? null);
    };
    const setMeta = async (driver, driverKey, properties) => {
      const metaKey = getMetaKey(driverKey);
      const existingFields = getMetaValue(await driver.getItem(metaKey));
      await driver.setItem(metaKey, mergeMeta(existingFields, properties));
    };
    const removeItem = async (driver, driverKey, opts) => {
      await driver.removeItem(driverKey);
      if (opts == null ? void 0 : opts.removeMeta) {
        const metaKey = getMetaKey(driverKey);
        await driver.removeItem(metaKey);
      }
    };
    const removeMeta = async (driver, driverKey, properties) => {
      const metaKey = getMetaKey(driverKey);
      if (properties == null) {
        await driver.removeItem(metaKey);
      } else {
        const newFields = getMetaValue(await driver.getItem(metaKey));
        [properties].flat().forEach((field) => delete newFields[field]);
        await driver.setItem(metaKey, newFields);
      }
    };
    const watch = (driver, driverKey, cb) => {
      return driver.watch(driverKey, cb);
    };
    const storage2 = {
      getItem: async (key, opts) => {
        const { driver, driverKey } = resolveKey(key);
        return await getItem(driver, driverKey, opts);
      },
      getItems: async (keys) => {
        const areaToKeyMap = /* @__PURE__ */ new Map();
        const keyToOptsMap = /* @__PURE__ */ new Map();
        const orderedKeys = [];
        keys.forEach((key) => {
          let keyStr;
          let opts;
          if (typeof key === "string") {
            keyStr = key;
          } else if ("getValue" in key) {
            keyStr = key.key;
            opts = { fallback: key.fallback };
          } else {
            keyStr = key.key;
            opts = key.options;
          }
          orderedKeys.push(keyStr);
          const { driverArea, driverKey } = resolveKey(keyStr);
          const areaKeys = areaToKeyMap.get(driverArea) ?? [];
          areaToKeyMap.set(driverArea, areaKeys.concat(driverKey));
          keyToOptsMap.set(keyStr, opts);
        });
        const resultsMap = /* @__PURE__ */ new Map();
        await Promise.all(
          Array.from(areaToKeyMap.entries()).map(async ([driverArea, keys2]) => {
            const driverResults = await drivers[driverArea].getItems(keys2);
            driverResults.forEach((driverResult) => {
              const key = `${driverArea}:${driverResult.key}`;
              const opts = keyToOptsMap.get(key);
              const value = getValueOrFallback(
                driverResult.value,
                (opts == null ? void 0 : opts.fallback) ?? (opts == null ? void 0 : opts.defaultValue)
              );
              resultsMap.set(key, value);
            });
          })
        );
        return orderedKeys.map((key) => ({
          key,
          value: resultsMap.get(key)
        }));
      },
      getMeta: async (key) => {
        const { driver, driverKey } = resolveKey(key);
        return await getMeta(driver, driverKey);
      },
      getMetas: async (args) => {
        const keys = args.map((arg) => {
          const key = typeof arg === "string" ? arg : arg.key;
          const { driverArea, driverKey } = resolveKey(key);
          return {
            key,
            driverArea,
            driverKey,
            driverMetaKey: getMetaKey(driverKey)
          };
        });
        const areaToDriverMetaKeysMap = keys.reduce((map, key) => {
          var _a2;
          map[_a2 = key.driverArea] ?? (map[_a2] = []);
          map[key.driverArea].push(key);
          return map;
        }, {});
        const resultsMap = {};
        await Promise.all(
          Object.entries(areaToDriverMetaKeysMap).map(async ([area, keys2]) => {
            const areaRes = await browser$1.storage[area].get(
              keys2.map((key) => key.driverMetaKey)
            );
            keys2.forEach((key) => {
              resultsMap[key.key] = areaRes[key.driverMetaKey] ?? {};
            });
          })
        );
        return keys.map((key) => ({
          key: key.key,
          meta: resultsMap[key.key]
        }));
      },
      setItem: async (key, value) => {
        const { driver, driverKey } = resolveKey(key);
        await setItem(driver, driverKey, value);
      },
      setItems: async (items) => {
        const areaToKeyValueMap = {};
        items.forEach((item) => {
          const { driverArea, driverKey } = resolveKey(
            "key" in item ? item.key : item.item.key
          );
          areaToKeyValueMap[driverArea] ?? (areaToKeyValueMap[driverArea] = []);
          areaToKeyValueMap[driverArea].push({
            key: driverKey,
            value: item.value
          });
        });
        await Promise.all(
          Object.entries(areaToKeyValueMap).map(async ([driverArea, values]) => {
            const driver = getDriver(driverArea);
            await driver.setItems(values);
          })
        );
      },
      setMeta: async (key, properties) => {
        const { driver, driverKey } = resolveKey(key);
        await setMeta(driver, driverKey, properties);
      },
      setMetas: async (items) => {
        const areaToMetaUpdatesMap = {};
        items.forEach((item) => {
          const { driverArea, driverKey } = resolveKey(
            "key" in item ? item.key : item.item.key
          );
          areaToMetaUpdatesMap[driverArea] ?? (areaToMetaUpdatesMap[driverArea] = []);
          areaToMetaUpdatesMap[driverArea].push({
            key: driverKey,
            properties: item.meta
          });
        });
        await Promise.all(
          Object.entries(areaToMetaUpdatesMap).map(
            async ([storageArea, updates]) => {
              const driver = getDriver(storageArea);
              const metaKeys = updates.map(({ key }) => getMetaKey(key));
              console.log(storageArea, metaKeys);
              const existingMetas = await driver.getItems(metaKeys);
              const existingMetaMap = Object.fromEntries(
                existingMetas.map(({ key, value }) => [key, getMetaValue(value)])
              );
              const metaUpdates = updates.map(({ key, properties }) => {
                const metaKey = getMetaKey(key);
                return {
                  key: metaKey,
                  value: mergeMeta(existingMetaMap[metaKey] ?? {}, properties)
                };
              });
              await driver.setItems(metaUpdates);
            }
          )
        );
      },
      removeItem: async (key, opts) => {
        const { driver, driverKey } = resolveKey(key);
        await removeItem(driver, driverKey, opts);
      },
      removeItems: async (keys) => {
        const areaToKeysMap = {};
        keys.forEach((key) => {
          let keyStr;
          let opts;
          if (typeof key === "string") {
            keyStr = key;
          } else if ("getValue" in key) {
            keyStr = key.key;
          } else if ("item" in key) {
            keyStr = key.item.key;
            opts = key.options;
          } else {
            keyStr = key.key;
            opts = key.options;
          }
          const { driverArea, driverKey } = resolveKey(keyStr);
          areaToKeysMap[driverArea] ?? (areaToKeysMap[driverArea] = []);
          areaToKeysMap[driverArea].push(driverKey);
          if (opts == null ? void 0 : opts.removeMeta) {
            areaToKeysMap[driverArea].push(getMetaKey(driverKey));
          }
        });
        await Promise.all(
          Object.entries(areaToKeysMap).map(async ([driverArea, keys2]) => {
            const driver = getDriver(driverArea);
            await driver.removeItems(keys2);
          })
        );
      },
      removeMeta: async (key, properties) => {
        const { driver, driverKey } = resolveKey(key);
        await removeMeta(driver, driverKey, properties);
      },
      snapshot: async (base, opts) => {
        var _a2;
        const driver = getDriver(base);
        const data = await driver.snapshot();
        (_a2 = opts == null ? void 0 : opts.excludeKeys) == null ? void 0 : _a2.forEach((key) => {
          delete data[key];
          delete data[getMetaKey(key)];
        });
        return data;
      },
      restoreSnapshot: async (base, data) => {
        const driver = getDriver(base);
        await driver.restoreSnapshot(data);
      },
      watch: (key, cb) => {
        const { driver, driverKey } = resolveKey(key);
        return watch(driver, driverKey, cb);
      },
      unwatch() {
        Object.values(drivers).forEach((driver) => {
          driver.unwatch();
        });
      },
      defineItem: (key, opts) => {
        const { driver, driverKey } = resolveKey(key);
        const { version: targetVersion = 1, migrations = {} } = opts ?? {};
        if (targetVersion < 1) {
          throw Error(
            "Storage item version cannot be less than 1. Initial versions should be set to 1, not 0."
          );
        }
        const migrate = async () => {
          var _a2;
          const driverMetaKey = getMetaKey(driverKey);
          const [{ value }, { value: meta }] = await driver.getItems([
            driverKey,
            driverMetaKey
          ]);
          if (value == null)
            return;
          const currentVersion = (meta == null ? void 0 : meta.v) ?? 1;
          if (currentVersion > targetVersion) {
            throw Error(
              `Version downgrade detected (v${currentVersion} -> v${targetVersion}) for "${key}"`
            );
          }
          console.debug(
            `[@wxt-dev/storage] Running storage migration for ${key}: v${currentVersion} -> v${targetVersion}`
          );
          const migrationsToRun = Array.from(
            { length: targetVersion - currentVersion },
            (_, i) => currentVersion + i + 1
          );
          let migratedValue = value;
          for (const migrateToVersion of migrationsToRun) {
            try {
              migratedValue = await ((_a2 = migrations == null ? void 0 : migrations[migrateToVersion]) == null ? void 0 : _a2.call(migrations, migratedValue)) ?? migratedValue;
            } catch (err) {
              throw Error(`v${migrateToVersion} migration failed for "${key}"`, {
                cause: err
              });
            }
          }
          await driver.setItems([
            { key: driverKey, value: migratedValue },
            { key: driverMetaKey, value: { ...meta, v: targetVersion } }
          ]);
          console.debug(
            `[@wxt-dev/storage] Storage migration completed for ${key} v${targetVersion}`,
            { migratedValue }
          );
        };
        const migrationsDone = (opts == null ? void 0 : opts.migrations) == null ? Promise.resolve() : migrate().catch((err) => {
          console.error(
            `[@wxt-dev/storage] Migration failed for ${key}`,
            err
          );
        });
        const initMutex = new Mutex();
        const getFallback = () => (opts == null ? void 0 : opts.fallback) ?? (opts == null ? void 0 : opts.defaultValue) ?? null;
        const getOrInitValue = () => initMutex.runExclusive(async () => {
          const value = await driver.getItem(driverKey);
          if (value != null || (opts == null ? void 0 : opts.init) == null)
            return value;
          const newValue = await opts.init();
          await driver.setItem(driverKey, newValue);
          return newValue;
        });
        migrationsDone.then(getOrInitValue);
        return {
          key,
          get defaultValue() {
            return getFallback();
          },
          get fallback() {
            return getFallback();
          },
          getValue: async () => {
            await migrationsDone;
            if (opts == null ? void 0 : opts.init) {
              return await getOrInitValue();
            } else {
              return await getItem(driver, driverKey, opts);
            }
          },
          getMeta: async () => {
            await migrationsDone;
            return await getMeta(driver, driverKey);
          },
          setValue: async (value) => {
            await migrationsDone;
            return await setItem(driver, driverKey, value);
          },
          setMeta: async (properties) => {
            await migrationsDone;
            return await setMeta(driver, driverKey, properties);
          },
          removeValue: async (opts2) => {
            await migrationsDone;
            return await removeItem(driver, driverKey, opts2);
          },
          removeMeta: async (properties) => {
            await migrationsDone;
            return await removeMeta(driver, driverKey, properties);
          },
          watch: (cb) => watch(
            driver,
            driverKey,
            (newValue, oldValue) => cb(newValue ?? getFallback(), oldValue ?? getFallback())
          ),
          migrate
        };
      }
    };
    return storage2;
  }
  function createDriver(storageArea) {
    const getStorageArea = () => {
      if (browser$1.runtime == null) {
        throw Error(
          [
            "'wxt/storage' must be loaded in a web extension environment",
            "\n - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371",
            " - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html\n"
          ].join("\n")
        );
      }
      if (browser$1.storage == null) {
        throw Error(
          "You must add the 'storage' permission to your manifest to use 'wxt/storage'"
        );
      }
      const area = browser$1.storage[storageArea];
      if (area == null)
        throw Error(`"browser.storage.${storageArea}" is undefined`);
      return area;
    };
    const watchListeners = /* @__PURE__ */ new Set();
    return {
      getItem: async (key) => {
        const res = await getStorageArea().get(key);
        return res[key];
      },
      getItems: async (keys) => {
        const result2 = await getStorageArea().get(keys);
        return keys.map((key) => ({ key, value: result2[key] ?? null }));
      },
      setItem: async (key, value) => {
        if (value == null) {
          await getStorageArea().remove(key);
        } else {
          await getStorageArea().set({ [key]: value });
        }
      },
      setItems: async (values) => {
        const map = values.reduce(
          (map2, { key, value }) => {
            map2[key] = value;
            return map2;
          },
          {}
        );
        await getStorageArea().set(map);
      },
      removeItem: async (key) => {
        await getStorageArea().remove(key);
      },
      removeItems: async (keys) => {
        await getStorageArea().remove(keys);
      },
      snapshot: async () => {
        return await getStorageArea().get();
      },
      restoreSnapshot: async (data) => {
        await getStorageArea().set(data);
      },
      watch(key, cb) {
        const listener = (changes) => {
          const change = changes[key];
          if (change == null)
            return;
          if (dequal(change.newValue, change.oldValue))
            return;
          cb(change.newValue ?? null, change.oldValue ?? null);
        };
        getStorageArea().onChanged.addListener(listener);
        watchListeners.add(listener);
        return () => {
          getStorageArea().onChanged.removeListener(listener);
          watchListeners.delete(listener);
        };
      },
      unwatch() {
        watchListeners.forEach((listener) => {
          getStorageArea().onChanged.removeListener(listener);
        });
        watchListeners.clear();
      }
    };
  }
  const CONTENT_SCRIPT_MATCHES = "https://www.youtube.com/*";
  content;
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var RecordRTC = { exports: {} };
  var hasRequiredRecordRTC;
  function requireRecordRTC() {
    if (hasRequiredRecordRTC) return RecordRTC.exports;
    hasRequiredRecordRTC = 1;
    (function(module) {
      /**
       * {@link https://github.com/muaz-khan/RecordRTC|RecordRTC} is a WebRTC JavaScript library for audio/video as well as screen activity recording. It supports Chrome, Firefox, Opera, Android, and Microsoft Edge. Platforms: Linux, Mac and Windows. 
       * @summary Record audio, video or screen inside the browser.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef RecordRTC
       * @class
       * @example
       * var recorder = RecordRTC(mediaStream or [arrayOfMediaStream], {
       *     type: 'video', // audio or video or gif or canvas
       *     recorderType: MediaStreamRecorder || CanvasRecorder || StereoAudioRecorder || Etc
       * });
       * recorder.startRecording();
       * @see For further information:
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - Single media-stream object, array of media-streams, html-canvas-element, etc.
       * @param {object} config - {type:"video", recorderType: MediaStreamRecorder, disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, desiredSampRate: 16000, video: HTMLVideoElement, etc.}
       */
      function RecordRTC2(mediaStream, config) {
        if (!mediaStream) {
          throw "First parameter is required.";
        }
        config = config || {
          type: "video"
        };
        config = new RecordRTCConfiguration(mediaStream, config);
        var self2 = this;
        function startRecording(config2) {
          if (!config.disableLogs) {
            console.log("RecordRTC version: ", self2.version);
          }
          if (!!config2) {
            config = new RecordRTCConfiguration(mediaStream, config2);
          }
          if (!config.disableLogs) {
            console.log("started recording " + config.type + " stream.");
          }
          if (mediaRecorder) {
            mediaRecorder.clearRecordedData();
            mediaRecorder.record();
            setState("recording");
            if (self2.recordingDuration) {
              handleRecordingDuration();
            }
            return self2;
          }
          initRecorder(function() {
            if (self2.recordingDuration) {
              handleRecordingDuration();
            }
          });
          return self2;
        }
        function initRecorder(initCallback) {
          if (initCallback) {
            config.initCallback = function() {
              initCallback();
              initCallback = config.initCallback = null;
            };
          }
          var Recorder = new GetRecorderType(mediaStream, config);
          mediaRecorder = new Recorder(mediaStream, config);
          mediaRecorder.record();
          setState("recording");
          if (!config.disableLogs) {
            console.log("Initialized recorderType:", mediaRecorder.constructor.name, "for output-type:", config.type);
          }
        }
        function stopRecording(callback) {
          callback = callback || function() {
          };
          if (!mediaRecorder) {
            warningLog();
            return;
          }
          if (self2.state === "paused") {
            self2.resumeRecording();
            setTimeout(function() {
              stopRecording(callback);
            }, 1);
            return;
          }
          if (self2.state !== "recording" && !config.disableLogs) {
            console.warn('Recording state should be: "recording", however current state is: ', self2.state);
          }
          if (!config.disableLogs) {
            console.log("Stopped recording " + config.type + " stream.");
          }
          if (config.type !== "gif") {
            mediaRecorder.stop(_callback);
          } else {
            mediaRecorder.stop();
            _callback();
          }
          setState("stopped");
          function _callback(__blob) {
            if (!mediaRecorder) {
              if (typeof callback.call === "function") {
                callback.call(self2, "");
              } else {
                callback("");
              }
              return;
            }
            Object.keys(mediaRecorder).forEach(function(key) {
              if (typeof mediaRecorder[key] === "function") {
                return;
              }
              self2[key] = mediaRecorder[key];
            });
            var blob = mediaRecorder.blob;
            if (!blob) {
              if (__blob) {
                mediaRecorder.blob = blob = __blob;
              } else {
                throw "Recording failed.";
              }
            }
            if (blob && !config.disableLogs) {
              console.log(blob.type, "->", bytesToSize(blob.size));
            }
            if (callback) {
              var url;
              try {
                url = URL2.createObjectURL(blob);
              } catch (e) {
              }
              if (typeof callback.call === "function") {
                callback.call(self2, url);
              } else {
                callback(url);
              }
            }
            if (!config.autoWriteToDisk) {
              return;
            }
            getDataURL(function(dataURL) {
              var parameter = {};
              parameter[config.type + "Blob"] = dataURL;
              DiskStorage.Store(parameter);
            });
          }
        }
        function pauseRecording() {
          if (!mediaRecorder) {
            warningLog();
            return;
          }
          if (self2.state !== "recording") {
            if (!config.disableLogs) {
              console.warn("Unable to pause the recording. Recording state: ", self2.state);
            }
            return;
          }
          setState("paused");
          mediaRecorder.pause();
          if (!config.disableLogs) {
            console.log("Paused recording.");
          }
        }
        function resumeRecording() {
          if (!mediaRecorder) {
            warningLog();
            return;
          }
          if (self2.state !== "paused") {
            if (!config.disableLogs) {
              console.warn("Unable to resume the recording. Recording state: ", self2.state);
            }
            return;
          }
          setState("recording");
          mediaRecorder.resume();
          if (!config.disableLogs) {
            console.log("Resumed recording.");
          }
        }
        function readFile(_blob) {
          postMessage(new FileReaderSync().readAsDataURL(_blob));
        }
        function getDataURL(callback, _mediaRecorder) {
          if (!callback) {
            throw "Pass a callback function over getDataURL.";
          }
          var blob = _mediaRecorder ? _mediaRecorder.blob : (mediaRecorder || {}).blob;
          if (!blob) {
            if (!config.disableLogs) {
              console.warn("Blob encoder did not finish its job yet.");
            }
            setTimeout(function() {
              getDataURL(callback, _mediaRecorder);
            }, 1e3);
            return;
          }
          if (typeof Worker !== "undefined" && !navigator.mozGetUserMedia) {
            var webWorker = processInWebWorker(readFile);
            webWorker.onmessage = function(event) {
              callback(event.data);
            };
            webWorker.postMessage(blob);
          } else {
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function(event) {
              callback(event.target.result);
            };
          }
          function processInWebWorker(_function) {
            try {
              var blob2 = URL2.createObjectURL(new Blob([
                _function.toString(),
                "this.onmessage =  function (eee) {" + _function.name + "(eee.data);}"
              ], {
                type: "application/javascript"
              }));
              var worker = new Worker(blob2);
              URL2.revokeObjectURL(blob2);
              return worker;
            } catch (e) {
            }
          }
        }
        function handleRecordingDuration(counter) {
          counter = counter || 0;
          if (self2.state === "paused") {
            setTimeout(function() {
              handleRecordingDuration(counter);
            }, 1e3);
            return;
          }
          if (self2.state === "stopped") {
            return;
          }
          if (counter >= self2.recordingDuration) {
            stopRecording(self2.onRecordingStopped);
            return;
          }
          counter += 1e3;
          setTimeout(function() {
            handleRecordingDuration(counter);
          }, 1e3);
        }
        function setState(state) {
          if (!self2) {
            return;
          }
          self2.state = state;
          if (typeof self2.onStateChanged.call === "function") {
            self2.onStateChanged.call(self2, state);
          } else {
            self2.onStateChanged(state);
          }
        }
        var WARNING = 'It seems that recorder is destroyed or "startRecording" is not invoked for ' + config.type + " recorder.";
        function warningLog() {
          if (config.disableLogs === true) {
            return;
          }
          console.warn(WARNING);
        }
        var mediaRecorder;
        var returnObject = {
          /**
           * This method starts the recording.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * var recorder = RecordRTC(mediaStream, {
           *     type: 'video'
           * });
           * recorder.startRecording();
           */
          startRecording,
          /**
           * This method stops the recording. It is strongly recommended to get "blob" or "URI" inside the callback to make sure all recorders finished their job.
           * @param {function} callback - Callback to get the recorded blob.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.stopRecording(function() {
           *     // use either "this" or "recorder" object; both are identical
           *     video.src = this.toURL();
           *     var blob = this.getBlob();
           * });
           */
          stopRecording,
          /**
           * This method pauses the recording. You can resume recording using "resumeRecording" method.
           * @method
           * @memberof RecordRTC
           * @instance
           * @todo Firefox is unable to pause the recording. Fix it.
           * @example
           * recorder.pauseRecording();  // pause the recording
           * recorder.resumeRecording(); // resume again
           */
          pauseRecording,
          /**
           * This method resumes the recording.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.pauseRecording();  // first of all, pause the recording
           * recorder.resumeRecording(); // now resume it
           */
          resumeRecording,
          /**
           * This method initializes the recording.
           * @method
           * @memberof RecordRTC
           * @instance
           * @todo This method should be deprecated.
           * @example
           * recorder.initRecorder();
           */
          initRecorder,
          /**
           * Ask RecordRTC to auto-stop the recording after 5 minutes.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * var fiveMinutes = 5 * 1000 * 60;
           * recorder.setRecordingDuration(fiveMinutes, function() {
           *    var blob = this.getBlob();
           *    video.src = this.toURL();
           * });
           * 
           * // or otherwise
           * recorder.setRecordingDuration(fiveMinutes).onRecordingStopped(function() {
           *    var blob = this.getBlob();
           *    video.src = this.toURL();
           * });
           */
          setRecordingDuration: function(recordingDuration, callback) {
            if (typeof recordingDuration === "undefined") {
              throw "recordingDuration is required.";
            }
            if (typeof recordingDuration !== "number") {
              throw "recordingDuration must be a number.";
            }
            self2.recordingDuration = recordingDuration;
            self2.onRecordingStopped = callback || function() {
            };
            return {
              onRecordingStopped: function(callback2) {
                self2.onRecordingStopped = callback2;
              }
            };
          },
          /**
           * This method can be used to clear/reset all the recorded data.
           * @method
           * @memberof RecordRTC
           * @instance
           * @todo Figure out the difference between "reset" and "clearRecordedData" methods.
           * @example
           * recorder.clearRecordedData();
           */
          clearRecordedData: function() {
            if (!mediaRecorder) {
              warningLog();
              return;
            }
            mediaRecorder.clearRecordedData();
            if (!config.disableLogs) {
              console.log("Cleared old recorded data.");
            }
          },
          /**
           * Get the recorded blob. Use this method inside the "stopRecording" callback.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.stopRecording(function() {
           *     var blob = this.getBlob();
           *
           *     var file = new File([blob], 'filename.webm', {
           *         type: 'video/webm'
           *     });
           *
           *     var formData = new FormData();
           *     formData.append('file', file); // upload "File" object rather than a "Blob"
           *     uploadToServer(formData);
           * });
           * @returns {Blob} Returns recorded data as "Blob" object.
           */
          getBlob: function() {
            if (!mediaRecorder) {
              warningLog();
              return;
            }
            return mediaRecorder.blob;
          },
          /**
           * Get data-URI instead of Blob.
           * @param {function} callback - Callback to get the Data-URI.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.stopRecording(function() {
           *     recorder.getDataURL(function(dataURI) {
           *         video.src = dataURI;
           *     });
           * });
           */
          getDataURL,
          /**
           * Get virtual/temporary URL. Usage of this URL is limited to current tab.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.stopRecording(function() {
           *     video.src = this.toURL();
           * });
           * @returns {String} Returns a virtual/temporary URL for the recorded "Blob".
           */
          toURL: function() {
            if (!mediaRecorder) {
              warningLog();
              return;
            }
            return URL2.createObjectURL(mediaRecorder.blob);
          },
          /**
           * Get internal recording object (i.e. internal module) e.g. MutliStreamRecorder, MediaStreamRecorder, StereoAudioRecorder or WhammyRecorder etc.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * var internalRecorder = recorder.getInternalRecorder();
           * if(internalRecorder instanceof MultiStreamRecorder) {
           *     internalRecorder.addStreams([newAudioStream]);
           *     internalRecorder.resetVideoStreams([screenStream]);
           * }
           * @returns {Object} Returns internal recording object.
           */
          getInternalRecorder: function() {
            return mediaRecorder;
          },
          /**
           * Invoke save-as dialog to save the recorded blob into your disk.
           * @param {string} fileName - Set your own file name.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.stopRecording(function() {
           *     this.save('file-name');
           *
           *     // or manually:
           *     invokeSaveAsDialog(this.getBlob(), 'filename.webm');
           * });
           */
          save: function(fileName) {
            if (!mediaRecorder) {
              warningLog();
              return;
            }
            invokeSaveAsDialog(mediaRecorder.blob, fileName);
          },
          /**
           * This method gets a blob from indexed-DB storage.
           * @param {function} callback - Callback to get the recorded blob.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.getFromDisk(function(dataURL) {
           *     video.src = dataURL;
           * });
           */
          getFromDisk: function(callback) {
            if (!mediaRecorder) {
              warningLog();
              return;
            }
            RecordRTC2.getFromDisk(config.type, callback);
          },
          /**
           * This method appends an array of webp images to the recorded video-blob. It takes an "array" object.
           * @type {Array.<Array>}
           * @param {Array} arrayOfWebPImages - Array of webp images.
           * @method
           * @memberof RecordRTC
           * @instance
           * @todo This method should be deprecated.
           * @example
           * var arrayOfWebPImages = [];
           * arrayOfWebPImages.push({
           *     duration: index,
           *     image: 'data:image/webp;base64,...'
           * });
           * recorder.setAdvertisementArray(arrayOfWebPImages);
           */
          setAdvertisementArray: function(arrayOfWebPImages) {
            config.advertisement = [];
            var length = arrayOfWebPImages.length;
            for (var i = 0; i < length; i++) {
              config.advertisement.push({
                duration: i,
                image: arrayOfWebPImages[i]
              });
            }
          },
          /**
           * It is equivalent to <code class="str">"recorder.getBlob()"</code> method. Usage of "getBlob" is recommended, though.
           * @property {Blob} blob - Recorded Blob can be accessed using this property.
           * @memberof RecordRTC
           * @instance
           * @readonly
           * @example
           * recorder.stopRecording(function() {
           *     var blob = this.blob;
           *
           *     // below one is recommended
           *     var blob = this.getBlob();
           * });
           */
          blob: null,
          /**
           * This works only with {recorderType:StereoAudioRecorder}. Use this property on "stopRecording" to verify the encoder's sample-rates.
           * @property {number} bufferSize - Buffer-size used to encode the WAV container
           * @memberof RecordRTC
           * @instance
           * @readonly
           * @example
           * recorder.stopRecording(function() {
           *     alert('Recorder used this buffer-size: ' + this.bufferSize);
           * });
           */
          bufferSize: 0,
          /**
           * This works only with {recorderType:StereoAudioRecorder}. Use this property on "stopRecording" to verify the encoder's sample-rates.
           * @property {number} sampleRate - Sample-rates used to encode the WAV container
           * @memberof RecordRTC
           * @instance
           * @readonly
           * @example
           * recorder.stopRecording(function() {
           *     alert('Recorder used these sample-rates: ' + this.sampleRate);
           * });
           */
          sampleRate: 0,
          /**
           * {recorderType:StereoAudioRecorder} returns ArrayBuffer object.
           * @property {ArrayBuffer} buffer - Audio ArrayBuffer, supported only in Chrome.
           * @memberof RecordRTC
           * @instance
           * @readonly
           * @example
           * recorder.stopRecording(function() {
           *     var arrayBuffer = this.buffer;
           *     alert(arrayBuffer.byteLength);
           * });
           */
          buffer: null,
          /**
           * This method resets the recorder. So that you can reuse single recorder instance many times.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.reset();
           * recorder.startRecording();
           */
          reset: function() {
            if (self2.state === "recording" && !config.disableLogs) {
              console.warn("Stop an active recorder.");
            }
            if (mediaRecorder && typeof mediaRecorder.clearRecordedData === "function") {
              mediaRecorder.clearRecordedData();
            }
            mediaRecorder = null;
            setState("inactive");
            self2.blob = null;
          },
          /**
           * This method is called whenever recorder's state changes. Use this as an "event".
           * @property {String} state - A recorder's state can be: recording, paused, stopped or inactive.
           * @method
           * @memberof RecordRTC
           * @instance
           * @example
           * recorder.onStateChanged = function(state) {
           *     console.log('Recorder state: ', state);
           * };
           */
          onStateChanged: function(state) {
            if (!config.disableLogs) {
              console.log("Recorder state changed:", state);
            }
          },
          /**
           * A recorder can have inactive, recording, paused or stopped states.
           * @property {String} state - A recorder's state can be: recording, paused, stopped or inactive.
           * @memberof RecordRTC
           * @static
           * @readonly
           * @example
           * // this looper function will keep you updated about the recorder's states.
           * (function looper() {
           *     document.querySelector('h1').innerHTML = 'Recorder\'s state is: ' + recorder.state;
           *     if(recorder.state === 'stopped') return; // ignore+stop
           *     setTimeout(looper, 1000); // update after every 3-seconds
           * })();
           * recorder.startRecording();
           */
          state: "inactive",
          /**
           * Get recorder's readonly state.
           * @method
           * @memberof RecordRTC
           * @example
           * var state = recorder.getState();
           * @returns {String} Returns recording state.
           */
          getState: function() {
            return self2.state;
          },
          /**
           * Destroy RecordRTC instance. Clear all recorders and objects.
           * @method
           * @memberof RecordRTC
           * @example
           * recorder.destroy();
           */
          destroy: function() {
            var disableLogsCache = config.disableLogs;
            config = {
              disableLogs: true
            };
            self2.reset();
            setState("destroyed");
            returnObject = self2 = null;
            if (Storage.AudioContextConstructor) {
              Storage.AudioContextConstructor.close();
              Storage.AudioContextConstructor = null;
            }
            config.disableLogs = disableLogsCache;
            if (!config.disableLogs) {
              console.log("RecordRTC is destroyed.");
            }
          },
          /**
           * RecordRTC version number
           * @property {String} version - Release version number.
           * @memberof RecordRTC
           * @static
           * @readonly
           * @example
           * alert(recorder.version);
           */
          version: "5.6.2"
        };
        if (!this) {
          self2 = returnObject;
          return returnObject;
        }
        for (var prop in returnObject) {
          this[prop] = returnObject[prop];
        }
        self2 = this;
        return returnObject;
      }
      RecordRTC2.version = "5.6.2";
      {
        module.exports = RecordRTC2;
      }
      RecordRTC2.getFromDisk = function(type, callback) {
        if (!callback) {
          throw "callback is mandatory.";
        }
        console.log("Getting recorded " + (type === "all" ? "blobs" : type + " blob ") + " from disk!");
        DiskStorage.Fetch(function(dataURL, _type) {
          if (type !== "all" && _type === type + "Blob" && callback) {
            callback(dataURL);
          }
          if (type === "all" && callback) {
            callback(dataURL, _type.replace("Blob", ""));
          }
        });
      };
      RecordRTC2.writeToDisk = function(options) {
        console.log("Writing recorded blob(s) to disk!");
        options = options || {};
        if (options.audio && options.video && options.gif) {
          options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
              options.gif.getDataURL(function(gifDataURL) {
                DiskStorage.Store({
                  audioBlob: audioDataURL,
                  videoBlob: videoDataURL,
                  gifBlob: gifDataURL
                });
              });
            });
          });
        } else if (options.audio && options.video) {
          options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
              DiskStorage.Store({
                audioBlob: audioDataURL,
                videoBlob: videoDataURL
              });
            });
          });
        } else if (options.audio && options.gif) {
          options.audio.getDataURL(function(audioDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
              DiskStorage.Store({
                audioBlob: audioDataURL,
                gifBlob: gifDataURL
              });
            });
          });
        } else if (options.video && options.gif) {
          options.video.getDataURL(function(videoDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
              DiskStorage.Store({
                videoBlob: videoDataURL,
                gifBlob: gifDataURL
              });
            });
          });
        } else if (options.audio) {
          options.audio.getDataURL(function(audioDataURL) {
            DiskStorage.Store({
              audioBlob: audioDataURL
            });
          });
        } else if (options.video) {
          options.video.getDataURL(function(videoDataURL) {
            DiskStorage.Store({
              videoBlob: videoDataURL
            });
          });
        } else if (options.gif) {
          options.gif.getDataURL(function(gifDataURL) {
            DiskStorage.Store({
              gifBlob: gifDataURL
            });
          });
        }
      };
      /**
       * {@link RecordRTCConfiguration} is an inner/private helper for {@link RecordRTC}.
       * @summary It configures the 2nd parameter passed over {@link RecordRTC} and returns a valid "config" object.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef RecordRTCConfiguration
       * @class
       * @example
       * var options = RecordRTCConfiguration(mediaStream, options);
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
       * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, getNativeBlob:true, etc.}
       */
      function RecordRTCConfiguration(mediaStream, config) {
        if (!config.recorderType && !config.type) {
          if (!!config.audio && !!config.video) {
            config.type = "video";
          } else if (!!config.audio && !config.video) {
            config.type = "audio";
          }
        }
        if (config.recorderType && !config.type) {
          if (config.recorderType === WhammyRecorder || config.recorderType === CanvasRecorder || typeof WebAssemblyRecorder !== "undefined" && config.recorderType === WebAssemblyRecorder) {
            config.type = "video";
          } else if (config.recorderType === GifRecorder) {
            config.type = "gif";
          } else if (config.recorderType === StereoAudioRecorder) {
            config.type = "audio";
          } else if (config.recorderType === MediaStreamRecorder) {
            if (getTracks(mediaStream, "audio").length && getTracks(mediaStream, "video").length) {
              config.type = "video";
            } else if (!getTracks(mediaStream, "audio").length && getTracks(mediaStream, "video").length) {
              config.type = "video";
            } else if (getTracks(mediaStream, "audio").length && !getTracks(mediaStream, "video").length) {
              config.type = "audio";
            } else ;
          }
        }
        if (typeof MediaStreamRecorder !== "undefined" && typeof MediaRecorder !== "undefined" && "requestData" in MediaRecorder.prototype) {
          if (!config.mimeType) {
            config.mimeType = "video/webm";
          }
          if (!config.type) {
            config.type = config.mimeType.split("/")[0];
          }
          if (!config.bitsPerSecond) ;
        }
        if (!config.type) {
          if (config.mimeType) {
            config.type = config.mimeType.split("/")[0];
          }
          if (!config.type) {
            config.type = "audio";
          }
        }
        return config;
      }
      /**
       * {@link GetRecorderType} is an inner/private helper for {@link RecordRTC}.
       * @summary It returns best recorder-type available for your browser.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef GetRecorderType
       * @class
       * @example
       * var RecorderType = GetRecorderType(options);
       * var recorder = new RecorderType(options);
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
       * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, etc.}
       */
      function GetRecorderType(mediaStream, config) {
        var recorder;
        if (isChrome || isEdge || isOpera) {
          recorder = StereoAudioRecorder;
        }
        if (typeof MediaRecorder !== "undefined" && "requestData" in MediaRecorder.prototype && !isChrome) {
          recorder = MediaStreamRecorder;
        }
        if (config.type === "video" && (isChrome || isOpera)) {
          recorder = WhammyRecorder;
          if (typeof WebAssemblyRecorder !== "undefined" && typeof ReadableStream !== "undefined") {
            recorder = WebAssemblyRecorder;
          }
        }
        if (config.type === "gif") {
          recorder = GifRecorder;
        }
        if (config.type === "canvas") {
          recorder = CanvasRecorder;
        }
        if (isMediaRecorderCompatible() && recorder !== CanvasRecorder && recorder !== GifRecorder && typeof MediaRecorder !== "undefined" && "requestData" in MediaRecorder.prototype) {
          if (getTracks(mediaStream, "video").length || getTracks(mediaStream, "audio").length) {
            if (config.type === "audio") {
              if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported("audio/webm")) {
                recorder = MediaStreamRecorder;
              }
            } else {
              if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported("video/webm")) {
                recorder = MediaStreamRecorder;
              }
            }
          }
        }
        if (mediaStream instanceof Array && mediaStream.length) {
          recorder = MultiStreamRecorder;
        }
        if (config.recorderType) {
          recorder = config.recorderType;
        }
        if (!config.disableLogs && !!recorder && !!recorder.name) {
          console.log("Using recorderType:", recorder.name || recorder.constructor.name);
        }
        if (!recorder && isSafari) {
          recorder = MediaStreamRecorder;
        }
        return recorder;
      }
      /**
       * MRecordRTC runs on top of {@link RecordRTC} to bring multiple recordings in a single place, by providing simple API.
       * @summary MRecordRTC stands for "Multiple-RecordRTC".
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef MRecordRTC
       * @class
       * @example
       * var recorder = new MRecordRTC();
       * recorder.addStream(MediaStream);
       * recorder.mediaType = {
       *     audio: true, // or StereoAudioRecorder or MediaStreamRecorder
       *     video: true, // or WhammyRecorder or MediaStreamRecorder or WebAssemblyRecorder or CanvasRecorder
       *     gif: true    // or GifRecorder
       * };
       * // mimeType is optional and should be set only in advance cases.
       * recorder.mimeType = {
       *     audio: 'audio/wav',
       *     video: 'video/webm',
       *     gif:   'image/gif'
       * };
       * recorder.startRecording();
       * @see For further information:
       * @see {@link https://github.com/muaz-khan/RecordRTC/tree/master/MRecordRTC|MRecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
       * @requires {@link RecordRTC}
       */
      function MRecordRTC(mediaStream) {
        this.addStream = function(_mediaStream) {
          if (_mediaStream) {
            mediaStream = _mediaStream;
          }
        };
        this.mediaType = {
          audio: true,
          video: true
        };
        this.startRecording = function() {
          var mediaType = this.mediaType;
          var recorderType;
          var mimeType = this.mimeType || {
            audio: null,
            video: null,
            gif: null
          };
          if (typeof mediaType.audio !== "function" && isMediaRecorderCompatible() && !getTracks(mediaStream, "audio").length) {
            mediaType.audio = false;
          }
          if (typeof mediaType.video !== "function" && isMediaRecorderCompatible() && !getTracks(mediaStream, "video").length) {
            mediaType.video = false;
          }
          if (typeof mediaType.gif !== "function" && isMediaRecorderCompatible() && !getTracks(mediaStream, "video").length) {
            mediaType.gif = false;
          }
          if (!mediaType.audio && !mediaType.video && !mediaType.gif) {
            throw "MediaStream must have either audio or video tracks.";
          }
          if (!!mediaType.audio) {
            recorderType = null;
            if (typeof mediaType.audio === "function") {
              recorderType = mediaType.audio;
            }
            this.audioRecorder = new RecordRTC2(mediaStream, {
              type: "audio",
              bufferSize: this.bufferSize,
              sampleRate: this.sampleRate,
              numberOfAudioChannels: this.numberOfAudioChannels || 2,
              disableLogs: this.disableLogs,
              recorderType,
              mimeType: mimeType.audio,
              timeSlice: this.timeSlice,
              onTimeStamp: this.onTimeStamp
            });
            if (!mediaType.video) {
              this.audioRecorder.startRecording();
            }
          }
          if (!!mediaType.video) {
            recorderType = null;
            if (typeof mediaType.video === "function") {
              recorderType = mediaType.video;
            }
            var newStream = mediaStream;
            if (isMediaRecorderCompatible() && !!mediaType.audio && typeof mediaType.audio === "function") {
              var videoTrack = getTracks(mediaStream, "video")[0];
              if (isFirefox) {
                newStream = new MediaStream();
                newStream.addTrack(videoTrack);
                if (recorderType && recorderType === WhammyRecorder) {
                  recorderType = MediaStreamRecorder;
                }
              } else {
                newStream = new MediaStream();
                newStream.addTrack(videoTrack);
              }
            }
            this.videoRecorder = new RecordRTC2(newStream, {
              type: "video",
              video: this.video,
              canvas: this.canvas,
              frameInterval: this.frameInterval || 10,
              disableLogs: this.disableLogs,
              recorderType,
              mimeType: mimeType.video,
              timeSlice: this.timeSlice,
              onTimeStamp: this.onTimeStamp,
              workerPath: this.workerPath,
              webAssemblyPath: this.webAssemblyPath,
              frameRate: this.frameRate,
              // used by WebAssemblyRecorder; values: usually 30; accepts any.
              bitrate: this.bitrate
              // used by WebAssemblyRecorder; values: 0 to 1000+
            });
            if (!mediaType.audio) {
              this.videoRecorder.startRecording();
            }
          }
          if (!!mediaType.audio && !!mediaType.video) {
            var self2 = this;
            var isSingleRecorder = isMediaRecorderCompatible() === true;
            if (mediaType.audio instanceof StereoAudioRecorder && !!mediaType.video) {
              isSingleRecorder = false;
            } else if (mediaType.audio !== true && mediaType.video !== true && mediaType.audio !== mediaType.video) {
              isSingleRecorder = false;
            }
            if (isSingleRecorder === true) {
              self2.audioRecorder = null;
              self2.videoRecorder.startRecording();
            } else {
              self2.videoRecorder.initRecorder(function() {
                self2.audioRecorder.initRecorder(function() {
                  self2.videoRecorder.startRecording();
                  self2.audioRecorder.startRecording();
                });
              });
            }
          }
          if (!!mediaType.gif) {
            recorderType = null;
            if (typeof mediaType.gif === "function") {
              recorderType = mediaType.gif;
            }
            this.gifRecorder = new RecordRTC2(mediaStream, {
              type: "gif",
              frameRate: this.frameRate || 200,
              quality: this.quality || 10,
              disableLogs: this.disableLogs,
              recorderType,
              mimeType: mimeType.gif
            });
            this.gifRecorder.startRecording();
          }
        };
        this.stopRecording = function(callback) {
          callback = callback || function() {
          };
          if (this.audioRecorder) {
            this.audioRecorder.stopRecording(function(blobURL) {
              callback(blobURL, "audio");
            });
          }
          if (this.videoRecorder) {
            this.videoRecorder.stopRecording(function(blobURL) {
              callback(blobURL, "video");
            });
          }
          if (this.gifRecorder) {
            this.gifRecorder.stopRecording(function(blobURL) {
              callback(blobURL, "gif");
            });
          }
        };
        this.pauseRecording = function() {
          if (this.audioRecorder) {
            this.audioRecorder.pauseRecording();
          }
          if (this.videoRecorder) {
            this.videoRecorder.pauseRecording();
          }
          if (this.gifRecorder) {
            this.gifRecorder.pauseRecording();
          }
        };
        this.resumeRecording = function() {
          if (this.audioRecorder) {
            this.audioRecorder.resumeRecording();
          }
          if (this.videoRecorder) {
            this.videoRecorder.resumeRecording();
          }
          if (this.gifRecorder) {
            this.gifRecorder.resumeRecording();
          }
        };
        this.getBlob = function(callback) {
          var output = {};
          if (this.audioRecorder) {
            output.audio = this.audioRecorder.getBlob();
          }
          if (this.videoRecorder) {
            output.video = this.videoRecorder.getBlob();
          }
          if (this.gifRecorder) {
            output.gif = this.gifRecorder.getBlob();
          }
          if (callback) {
            callback(output);
          }
          return output;
        };
        this.destroy = function() {
          if (this.audioRecorder) {
            this.audioRecorder.destroy();
            this.audioRecorder = null;
          }
          if (this.videoRecorder) {
            this.videoRecorder.destroy();
            this.videoRecorder = null;
          }
          if (this.gifRecorder) {
            this.gifRecorder.destroy();
            this.gifRecorder = null;
          }
        };
        this.getDataURL = function(callback) {
          this.getBlob(function(blob) {
            if (blob.audio && blob.video) {
              getDataURL(blob.audio, function(_audioDataURL) {
                getDataURL(blob.video, function(_videoDataURL) {
                  callback({
                    audio: _audioDataURL,
                    video: _videoDataURL
                  });
                });
              });
            } else if (blob.audio) {
              getDataURL(blob.audio, function(_audioDataURL) {
                callback({
                  audio: _audioDataURL
                });
              });
            } else if (blob.video) {
              getDataURL(blob.video, function(_videoDataURL) {
                callback({
                  video: _videoDataURL
                });
              });
            }
          });
          function getDataURL(blob, callback00) {
            if (typeof Worker !== "undefined") {
              var webWorker = processInWebWorker(function readFile(_blob) {
                postMessage(new FileReaderSync().readAsDataURL(_blob));
              });
              webWorker.onmessage = function(event) {
                callback00(event.data);
              };
              webWorker.postMessage(blob);
            } else {
              var reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onload = function(event) {
                callback00(event.target.result);
              };
            }
          }
          function processInWebWorker(_function) {
            var blob = URL2.createObjectURL(new Blob([
              _function.toString(),
              "this.onmessage =  function (eee) {" + _function.name + "(eee.data);}"
            ], {
              type: "application/javascript"
            }));
            var worker = new Worker(blob);
            var url;
            if (typeof URL2 !== "undefined") {
              url = URL2;
            } else if (typeof webkitURL !== "undefined") {
              url = webkitURL;
            } else {
              throw "Neither URL nor webkitURL detected.";
            }
            url.revokeObjectURL(blob);
            return worker;
          }
        };
        this.writeToDisk = function() {
          RecordRTC2.writeToDisk({
            audio: this.audioRecorder,
            video: this.videoRecorder,
            gif: this.gifRecorder
          });
        };
        this.save = function(args) {
          args = args || {
            audio: true,
            video: true,
            gif: true
          };
          if (!!args.audio && this.audioRecorder) {
            this.audioRecorder.save(typeof args.audio === "string" ? args.audio : "");
          }
          if (!!args.video && this.videoRecorder) {
            this.videoRecorder.save(typeof args.video === "string" ? args.video : "");
          }
          if (!!args.gif && this.gifRecorder) {
            this.gifRecorder.save(typeof args.gif === "string" ? args.gif : "");
          }
        };
      }
      MRecordRTC.getFromDisk = RecordRTC2.getFromDisk;
      MRecordRTC.writeToDisk = RecordRTC2.writeToDisk;
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.MRecordRTC = MRecordRTC;
      }
      var browserFakeUserAgent = "Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45";
      (function(that) {
        if (!that) {
          return;
        }
        if (typeof window !== "undefined") {
          return;
        }
        if (typeof commonjsGlobal === "undefined") {
          return;
        }
        commonjsGlobal.navigator = {
          userAgent: browserFakeUserAgent,
          getUserMedia: function() {
          }
        };
        if (!commonjsGlobal.console) {
          commonjsGlobal.console = {};
        }
        if (typeof commonjsGlobal.console.log === "undefined" || typeof commonjsGlobal.console.error === "undefined") {
          commonjsGlobal.console.error = commonjsGlobal.console.log = commonjsGlobal.console.log || function() {
            console.log(arguments);
          };
        }
        if (typeof document === "undefined") {
          that.document = {
            documentElement: {
              appendChild: function() {
                return "";
              }
            }
          };
          document.createElement = document.captureStream = document.mozCaptureStream = function() {
            var obj = {
              getContext: function() {
                return obj;
              },
              play: function() {
              },
              pause: function() {
              },
              drawImage: function() {
              },
              toDataURL: function() {
                return "";
              },
              style: {}
            };
            return obj;
          };
          that.HTMLVideoElement = function() {
          };
        }
        if (typeof location === "undefined") {
          that.location = {
            protocol: "file:",
            href: "",
            hash: ""
          };
        }
        if (typeof screen === "undefined") {
          that.screen = {
            width: 0,
            height: 0
          };
        }
        if (typeof URL2 === "undefined") {
          that.URL = {
            createObjectURL: function() {
              return "";
            },
            revokeObjectURL: function() {
              return "";
            }
          };
        }
        that.window = commonjsGlobal;
      })(typeof commonjsGlobal !== "undefined" ? commonjsGlobal : null);
      var requestAnimationFrame2 = window.requestAnimationFrame;
      if (typeof requestAnimationFrame2 === "undefined") {
        if (typeof webkitRequestAnimationFrame !== "undefined") {
          requestAnimationFrame2 = webkitRequestAnimationFrame;
        } else if (typeof mozRequestAnimationFrame !== "undefined") {
          requestAnimationFrame2 = mozRequestAnimationFrame;
        } else if (typeof msRequestAnimationFrame !== "undefined") {
          requestAnimationFrame2 = msRequestAnimationFrame;
        } else if (typeof requestAnimationFrame2 === "undefined") {
          var lastTime = 0;
          requestAnimationFrame2 = function(callback, element) {
            var currTime = (/* @__PURE__ */ new Date()).getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = setTimeout(function() {
              callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
          };
        }
      }
      var cancelAnimationFrame2 = window.cancelAnimationFrame;
      if (typeof cancelAnimationFrame2 === "undefined") {
        if (typeof webkitCancelAnimationFrame !== "undefined") {
          cancelAnimationFrame2 = webkitCancelAnimationFrame;
        } else if (typeof mozCancelAnimationFrame !== "undefined") {
          cancelAnimationFrame2 = mozCancelAnimationFrame;
        } else if (typeof msCancelAnimationFrame !== "undefined") {
          cancelAnimationFrame2 = msCancelAnimationFrame;
        } else if (typeof cancelAnimationFrame2 === "undefined") {
          cancelAnimationFrame2 = function(id) {
            clearTimeout(id);
          };
        }
      }
      var AudioContext = window.AudioContext;
      if (typeof AudioContext === "undefined") {
        if (typeof webkitAudioContext !== "undefined") {
          AudioContext = webkitAudioContext;
        }
        if (typeof mozAudioContext !== "undefined") {
          AudioContext = mozAudioContext;
        }
      }
      var URL2 = window.URL;
      if (typeof URL2 === "undefined" && typeof webkitURL !== "undefined") {
        URL2 = webkitURL;
      }
      if (typeof navigator !== "undefined" && typeof navigator.getUserMedia === "undefined") {
        if (typeof navigator.webkitGetUserMedia !== "undefined") {
          navigator.getUserMedia = navigator.webkitGetUserMedia;
        }
        if (typeof navigator.mozGetUserMedia !== "undefined") {
          navigator.getUserMedia = navigator.mozGetUserMedia;
        }
      }
      var isEdge = navigator.userAgent.indexOf("Edge") !== -1 && (!!navigator.msSaveBlob || !!navigator.msSaveOrOpenBlob);
      var isOpera = !!window.opera || navigator.userAgent.indexOf("OPR/") !== -1;
      var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1 && "netscape" in window && / rv:/.test(navigator.userAgent);
      var isChrome = !isOpera && !isEdge && !!navigator.webkitGetUserMedia || isElectron() || navigator.userAgent.toLowerCase().indexOf("chrome/") !== -1;
      var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari && !isChrome && navigator.userAgent.indexOf("CriOS") !== -1) {
        isSafari = false;
        isChrome = true;
      }
      var MediaStream = window.MediaStream;
      if (typeof MediaStream === "undefined" && typeof webkitMediaStream !== "undefined") {
        MediaStream = webkitMediaStream;
      }
      if (typeof MediaStream !== "undefined") {
        if (typeof MediaStream.prototype.stop === "undefined") {
          MediaStream.prototype.stop = function() {
            this.getTracks().forEach(function(track) {
              track.stop();
            });
          };
        }
      }
      function bytesToSize(bytes) {
        var k = 1e3;
        var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        if (bytes === 0) {
          return "0 Bytes";
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
        return (bytes / Math.pow(k, i)).toPrecision(3) + " " + sizes[i];
      }
      function invokeSaveAsDialog(file, fileName) {
        if (!file) {
          throw "Blob object is required.";
        }
        if (!file.type) {
          try {
            file.type = "video/webm";
          } catch (e) {
          }
        }
        var fileExtension = (file.type || "video/webm").split("/")[1];
        if (fileExtension.indexOf(";") !== -1) {
          fileExtension = fileExtension.split(";")[0];
        }
        if (fileName && fileName.indexOf(".") !== -1) {
          var splitted = fileName.split(".");
          fileName = splitted[0];
          fileExtension = splitted[1];
        }
        var fileFullName = (fileName || Math.round(Math.random() * 9999999999) + 888888888) + "." + fileExtension;
        if (typeof navigator.msSaveOrOpenBlob !== "undefined") {
          return navigator.msSaveOrOpenBlob(file, fileFullName);
        } else if (typeof navigator.msSaveBlob !== "undefined") {
          return navigator.msSaveBlob(file, fileFullName);
        }
        var hyperlink = document.createElement("a");
        hyperlink.href = URL2.createObjectURL(file);
        hyperlink.download = fileFullName;
        hyperlink.style = "display:none;opacity:0;color:transparent;";
        (document.body || document.documentElement).appendChild(hyperlink);
        if (typeof hyperlink.click === "function") {
          hyperlink.click();
        } else {
          hyperlink.target = "_blank";
          hyperlink.dispatchEvent(new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
          }));
        }
        URL2.revokeObjectURL(hyperlink.href);
      }
      function isElectron() {
        if (typeof window !== "undefined" && typeof window.process === "object" && window.process.type === "renderer") {
          return true;
        }
        if (typeof process !== "undefined" && typeof process.versions === "object" && !!process.versions.electron) {
          return true;
        }
        if (typeof navigator === "object" && typeof navigator.userAgent === "string" && navigator.userAgent.indexOf("Electron") >= 0) {
          return true;
        }
        return false;
      }
      function getTracks(stream, kind) {
        if (!stream || !stream.getTracks) {
          return [];
        }
        return stream.getTracks().filter(function(t) {
          return t.kind === (kind || "audio");
        });
      }
      function setSrcObject(stream, element) {
        if ("srcObject" in element) {
          element.srcObject = stream;
        } else if ("mozSrcObject" in element) {
          element.mozSrcObject = stream;
        } else {
          element.srcObject = stream;
        }
      }
      function getSeekableBlob(inputBlob, callback) {
        if (typeof EBML === "undefined") {
          throw new Error("Please link: https://www.webrtc-experiment.com/EBML.js");
        }
        var reader = new EBML.Reader();
        var decoder = new EBML.Decoder();
        var tools = EBML.tools;
        var fileReader = new FileReader();
        fileReader.onload = function(e) {
          var ebmlElms = decoder.decode(this.result);
          ebmlElms.forEach(function(element) {
            reader.read(element);
          });
          reader.stop();
          var refinedMetadataBuf = tools.makeMetadataSeekable(reader.metadatas, reader.duration, reader.cues);
          var body = this.result.slice(reader.metadataSize);
          var newBlob = new Blob([refinedMetadataBuf, body], {
            type: "video/webm"
          });
          callback(newBlob);
        };
        fileReader.readAsArrayBuffer(inputBlob);
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.invokeSaveAsDialog = invokeSaveAsDialog;
        RecordRTC2.getTracks = getTracks;
        RecordRTC2.getSeekableBlob = getSeekableBlob;
        RecordRTC2.bytesToSize = bytesToSize;
        RecordRTC2.isElectron = isElectron;
      }
      /**
       * Storage is a standalone object used by {@link RecordRTC} to store reusable objects e.g. "new AudioContext".
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @example
       * Storage.AudioContext === webkitAudioContext
       * @property {webkitAudioContext} AudioContext - Keeps a reference to AudioContext object.
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       */
      var Storage = {};
      if (typeof AudioContext !== "undefined") {
        Storage.AudioContext = AudioContext;
      } else if (typeof webkitAudioContext !== "undefined") {
        Storage.AudioContext = webkitAudioContext;
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.Storage = Storage;
      }
      function isMediaRecorderCompatible() {
        if (isFirefox || isSafari || isEdge) {
          return true;
        }
        var nAgt = navigator.userAgent;
        var fullVersion = "" + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var verOffset, ix;
        if (isChrome || isOpera) {
          verOffset = nAgt.indexOf("Chrome");
          fullVersion = nAgt.substring(verOffset + 7);
        }
        if ((ix = fullVersion.indexOf(";")) !== -1) {
          fullVersion = fullVersion.substring(0, ix);
        }
        if ((ix = fullVersion.indexOf(" ")) !== -1) {
          fullVersion = fullVersion.substring(0, ix);
        }
        majorVersion = parseInt("" + fullVersion, 10);
        if (isNaN(majorVersion)) {
          fullVersion = "" + parseFloat(navigator.appVersion);
          majorVersion = parseInt(navigator.appVersion, 10);
        }
        return majorVersion >= 49;
      }
      /**
       * MediaStreamRecorder is an abstraction layer for {@link https://w3c.github.io/mediacapture-record/MediaRecorder.html|MediaRecorder API}. It is used by {@link RecordRTC} to record MediaStream(s) in both Chrome and Firefox.
       * @summary Runs top over {@link https://w3c.github.io/mediacapture-record/MediaRecorder.html|MediaRecorder API}.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://github.com/muaz-khan|Muaz Khan}
       * @typedef MediaStreamRecorder
       * @class
       * @example
       * var config = {
       *     mimeType: 'video/webm', // vp8, vp9, h264, mkv, opus/vorbis
       *     audioBitsPerSecond : 256 * 8 * 1024,
       *     videoBitsPerSecond : 256 * 8 * 1024,
       *     bitsPerSecond: 256 * 8 * 1024,  // if this is provided, skip above two
       *     checkForInactiveTracks: true,
       *     timeSlice: 1000, // concatenate intervals based blobs
       *     ondataavailable: function() {} // get intervals based blobs
       * }
       * var recorder = new MediaStreamRecorder(mediaStream, config);
       * recorder.record();
       * recorder.stop(function(blob) {
       *     video.src = URL.createObjectURL(blob);
       *
       *     // or
       *     var blob = recorder.blob;
       * });
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
       * @param {object} config - {disableLogs:true, initCallback: function, mimeType: "video/webm", timeSlice: 1000}
       * @throws Will throw an error if first argument "MediaStream" is missing. Also throws error if "MediaRecorder API" are not supported by the browser.
       */
      function MediaStreamRecorder(mediaStream, config) {
        var self2 = this;
        if (typeof mediaStream === "undefined") {
          throw 'First argument "MediaStream" is required.';
        }
        if (typeof MediaRecorder === "undefined") {
          throw "Your browser does not support the Media Recorder API. Please try other modules e.g. WhammyRecorder or StereoAudioRecorder.";
        }
        config = config || {
          // bitsPerSecond: 256 * 8 * 1024,
          mimeType: "video/webm"
        };
        if (config.type === "audio") {
          if (getTracks(mediaStream, "video").length && getTracks(mediaStream, "audio").length) {
            var stream;
            if (!!navigator.mozGetUserMedia) {
              stream = new MediaStream();
              stream.addTrack(getTracks(mediaStream, "audio")[0]);
            } else {
              stream = new MediaStream(getTracks(mediaStream, "audio"));
            }
            mediaStream = stream;
          }
          if (!config.mimeType || config.mimeType.toString().toLowerCase().indexOf("audio") === -1) {
            config.mimeType = isChrome ? "audio/webm" : "audio/ogg";
          }
          if (config.mimeType && config.mimeType.toString().toLowerCase() !== "audio/ogg" && !!navigator.mozGetUserMedia) {
            config.mimeType = "audio/ogg";
          }
        }
        var arrayOfBlobs = [];
        this.getArrayOfBlobs = function() {
          return arrayOfBlobs;
        };
        this.record = function() {
          self2.blob = null;
          self2.clearRecordedData();
          self2.timestamps = [];
          allStates = [];
          arrayOfBlobs = [];
          var recorderHints = config;
          if (!config.disableLogs) {
            console.log("Passing following config over MediaRecorder API.", recorderHints);
          }
          if (mediaRecorder) {
            mediaRecorder = null;
          }
          if (isChrome && !isMediaRecorderCompatible()) {
            recorderHints = "video/vp8";
          }
          if (typeof MediaRecorder.isTypeSupported === "function" && recorderHints.mimeType) {
            if (!MediaRecorder.isTypeSupported(recorderHints.mimeType)) {
              if (!config.disableLogs) {
                console.warn("MediaRecorder API seems unable to record mimeType:", recorderHints.mimeType);
              }
              recorderHints.mimeType = config.type === "audio" ? "audio/webm" : "video/webm";
            }
          }
          try {
            mediaRecorder = new MediaRecorder(mediaStream, recorderHints);
            config.mimeType = recorderHints.mimeType;
          } catch (e) {
            mediaRecorder = new MediaRecorder(mediaStream);
          }
          if (recorderHints.mimeType && !MediaRecorder.isTypeSupported && "canRecordMimeType" in mediaRecorder && mediaRecorder.canRecordMimeType(recorderHints.mimeType) === false) {
            if (!config.disableLogs) {
              console.warn("MediaRecorder API seems unable to record mimeType:", recorderHints.mimeType);
            }
          }
          mediaRecorder.ondataavailable = function(e) {
            if (e.data) {
              allStates.push("ondataavailable: " + bytesToSize(e.data.size));
            }
            if (typeof config.timeSlice === "number") {
              if (e.data && e.data.size) {
                arrayOfBlobs.push(e.data);
                updateTimeStamp();
                if (typeof config.ondataavailable === "function") {
                  var blob = config.getNativeBlob ? e.data : new Blob([e.data], {
                    type: getMimeType(recorderHints)
                  });
                  config.ondataavailable(blob);
                }
              }
              return;
            }
            if (!e.data || !e.data.size || e.data.size < 100 || self2.blob) {
              if (self2.recordingCallback) {
                self2.recordingCallback(new Blob([], {
                  type: getMimeType(recorderHints)
                }));
                self2.recordingCallback = null;
              }
              return;
            }
            self2.blob = config.getNativeBlob ? e.data : new Blob([e.data], {
              type: getMimeType(recorderHints)
            });
            if (self2.recordingCallback) {
              self2.recordingCallback(self2.blob);
              self2.recordingCallback = null;
            }
          };
          mediaRecorder.onstart = function() {
            allStates.push("started");
          };
          mediaRecorder.onpause = function() {
            allStates.push("paused");
          };
          mediaRecorder.onresume = function() {
            allStates.push("resumed");
          };
          mediaRecorder.onstop = function() {
            allStates.push("stopped");
          };
          mediaRecorder.onerror = function(error) {
            if (!error) {
              return;
            }
            if (!error.name) {
              error.name = "UnknownError";
            }
            allStates.push("error: " + error);
            if (!config.disableLogs) {
              if (error.name.toString().toLowerCase().indexOf("invalidstate") !== -1) {
                console.error("The MediaRecorder is not in a state in which the proposed operation is allowed to be executed.", error);
              } else if (error.name.toString().toLowerCase().indexOf("notsupported") !== -1) {
                console.error("MIME type (", recorderHints.mimeType, ") is not supported.", error);
              } else if (error.name.toString().toLowerCase().indexOf("security") !== -1) {
                console.error("MediaRecorder security error", error);
              } else if (error.name === "OutOfMemory") {
                console.error("The UA has exhaused the available memory. User agents SHOULD provide as much additional information as possible in the message attribute.", error);
              } else if (error.name === "IllegalStreamModification") {
                console.error("A modification to the stream has occurred that makes it impossible to continue recording. An example would be the addition of a Track while recording is occurring. User agents SHOULD provide as much additional information as possible in the message attribute.", error);
              } else if (error.name === "OtherRecordingError") {
                console.error("Used for an fatal error other than those listed above. User agents SHOULD provide as much additional information as possible in the message attribute.", error);
              } else if (error.name === "GenericError") {
                console.error("The UA cannot provide the codec or recording option that has been requested.", error);
              } else {
                console.error("MediaRecorder Error", error);
              }
            }
            (function(looper) {
              if (!self2.manuallyStopped && mediaRecorder && mediaRecorder.state === "inactive") {
                delete config.timeslice;
                mediaRecorder.start(10 * 60 * 1e3);
                return;
              }
              setTimeout(looper, 1e3);
            })();
            if (mediaRecorder.state !== "inactive" && mediaRecorder.state !== "stopped") {
              mediaRecorder.stop();
            }
          };
          if (typeof config.timeSlice === "number") {
            updateTimeStamp();
            mediaRecorder.start(config.timeSlice);
          } else {
            mediaRecorder.start(36e5);
          }
          if (config.initCallback) {
            config.initCallback();
          }
        };
        this.timestamps = [];
        function updateTimeStamp() {
          self2.timestamps.push((/* @__PURE__ */ new Date()).getTime());
          if (typeof config.onTimeStamp === "function") {
            config.onTimeStamp(self2.timestamps[self2.timestamps.length - 1], self2.timestamps);
          }
        }
        function getMimeType(secondObject) {
          if (mediaRecorder && mediaRecorder.mimeType) {
            return mediaRecorder.mimeType;
          }
          return secondObject.mimeType || "video/webm";
        }
        this.stop = function(callback) {
          callback = callback || function() {
          };
          self2.manuallyStopped = true;
          if (!mediaRecorder) {
            return;
          }
          this.recordingCallback = callback;
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
          if (typeof config.timeSlice === "number") {
            setTimeout(function() {
              self2.blob = new Blob(arrayOfBlobs, {
                type: getMimeType(config)
              });
              self2.recordingCallback(self2.blob);
            }, 100);
          }
        };
        this.pause = function() {
          if (!mediaRecorder) {
            return;
          }
          if (mediaRecorder.state === "recording") {
            mediaRecorder.pause();
          }
        };
        this.resume = function() {
          if (!mediaRecorder) {
            return;
          }
          if (mediaRecorder.state === "paused") {
            mediaRecorder.resume();
          }
        };
        this.clearRecordedData = function() {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            self2.stop(clearRecordedDataCB);
          }
          clearRecordedDataCB();
        };
        function clearRecordedDataCB() {
          arrayOfBlobs = [];
          mediaRecorder = null;
          self2.timestamps = [];
        }
        var mediaRecorder;
        this.getInternalRecorder = function() {
          return mediaRecorder;
        };
        function isMediaStreamActive() {
          if ("active" in mediaStream) {
            if (!mediaStream.active) {
              return false;
            }
          } else if ("ended" in mediaStream) {
            if (mediaStream.ended) {
              return false;
            }
          }
          return true;
        }
        this.blob = null;
        this.getState = function() {
          if (!mediaRecorder) {
            return "inactive";
          }
          return mediaRecorder.state || "inactive";
        };
        var allStates = [];
        this.getAllStates = function() {
          return allStates;
        };
        if (typeof config.checkForInactiveTracks === "undefined") {
          config.checkForInactiveTracks = false;
        }
        var self2 = this;
        (function looper() {
          if (!mediaRecorder || config.checkForInactiveTracks === false) {
            return;
          }
          if (isMediaStreamActive() === false) {
            if (!config.disableLogs) {
              console.log("MediaStream seems stopped.");
            }
            self2.stop();
            return;
          }
          setTimeout(looper, 1e3);
        })();
        this.name = "MediaStreamRecorder";
        this.toString = function() {
          return this.name;
        };
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.MediaStreamRecorder = MediaStreamRecorder;
      }
      /**
       * StereoAudioRecorder is a standalone class used by {@link RecordRTC} to bring "stereo" audio-recording in chrome.
       * @summary JavaScript standalone object for stereo audio recording.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef StereoAudioRecorder
       * @class
       * @example
       * var recorder = new StereoAudioRecorder(MediaStream, {
       *     sampleRate: 44100,
       *     bufferSize: 4096
       * });
       * recorder.record();
       * recorder.stop(function(blob) {
       *     video.src = URL.createObjectURL(blob);
       * });
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
       * @param {object} config - {sampleRate: 44100, bufferSize: 4096, numberOfAudioChannels: 1, etc.}
       */
      function StereoAudioRecorder(mediaStream, config) {
        if (!getTracks(mediaStream, "audio").length) {
          throw "Your stream has no audio tracks.";
        }
        config = config || {};
        var self2 = this;
        var leftchannel = [];
        var rightchannel = [];
        var recording = false;
        var recordingLength = 0;
        var jsAudioNode;
        var numberOfAudioChannels = 2;
        var desiredSampRate = config.desiredSampRate;
        if (config.leftChannel === true) {
          numberOfAudioChannels = 1;
        }
        if (config.numberOfAudioChannels === 1) {
          numberOfAudioChannels = 1;
        }
        if (!numberOfAudioChannels || numberOfAudioChannels < 1) {
          numberOfAudioChannels = 2;
        }
        if (!config.disableLogs) {
          console.log("StereoAudioRecorder is set to record number of channels: " + numberOfAudioChannels);
        }
        if (typeof config.checkForInactiveTracks === "undefined") {
          config.checkForInactiveTracks = true;
        }
        function isMediaStreamActive() {
          if (config.checkForInactiveTracks === false) {
            return true;
          }
          if ("active" in mediaStream) {
            if (!mediaStream.active) {
              return false;
            }
          } else if ("ended" in mediaStream) {
            if (mediaStream.ended) {
              return false;
            }
          }
          return true;
        }
        this.record = function() {
          if (isMediaStreamActive() === false) {
            throw "Please make sure MediaStream is active.";
          }
          resetVariables();
          isAudioProcessStarted = isPaused = false;
          recording = true;
          if (typeof config.timeSlice !== "undefined") {
            looper();
          }
        };
        function mergeLeftRightBuffers(config2, callback) {
          function mergeAudioBuffers(config3, cb) {
            var numberOfAudioChannels2 = config3.numberOfAudioChannels;
            var leftBuffers = config3.leftBuffers.slice(0);
            var rightBuffers = config3.rightBuffers.slice(0);
            var sampleRate2 = config3.sampleRate;
            var internalInterleavedLength = config3.internalInterleavedLength;
            var desiredSampRate2 = config3.desiredSampRate;
            if (numberOfAudioChannels2 === 2) {
              leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
              rightBuffers = mergeBuffers(rightBuffers, internalInterleavedLength);
              if (desiredSampRate2) {
                leftBuffers = interpolateArray(leftBuffers, desiredSampRate2, sampleRate2);
                rightBuffers = interpolateArray(rightBuffers, desiredSampRate2, sampleRate2);
              }
            }
            if (numberOfAudioChannels2 === 1) {
              leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
              if (desiredSampRate2) {
                leftBuffers = interpolateArray(leftBuffers, desiredSampRate2, sampleRate2);
              }
            }
            if (desiredSampRate2) {
              sampleRate2 = desiredSampRate2;
            }
            function interpolateArray(data, newSampleRate, oldSampleRate) {
              var fitCount = Math.round(data.length * (newSampleRate / oldSampleRate));
              var newData = [];
              var springFactor = Number((data.length - 1) / (fitCount - 1));
              newData[0] = data[0];
              for (var i2 = 1; i2 < fitCount - 1; i2++) {
                var tmp = i2 * springFactor;
                var before = Number(Math.floor(tmp)).toFixed();
                var after = Number(Math.ceil(tmp)).toFixed();
                var atPoint = tmp - before;
                newData[i2] = linearInterpolate(data[before], data[after], atPoint);
              }
              newData[fitCount - 1] = data[data.length - 1];
              return newData;
            }
            function linearInterpolate(before, after, atPoint) {
              return before + (after - before) * atPoint;
            }
            function mergeBuffers(channelBuffer, rLength) {
              var result2 = new Float64Array(rLength);
              var offset = 0;
              var lng2 = channelBuffer.length;
              for (var i2 = 0; i2 < lng2; i2++) {
                var buffer2 = channelBuffer[i2];
                result2.set(buffer2, offset);
                offset += buffer2.length;
              }
              return result2;
            }
            function interleave(leftChannel, rightChannel) {
              var length = leftChannel.length + rightChannel.length;
              var result2 = new Float64Array(length);
              var inputIndex = 0;
              for (var index2 = 0; index2 < length; ) {
                result2[index2++] = leftChannel[inputIndex];
                result2[index2++] = rightChannel[inputIndex];
                inputIndex++;
              }
              return result2;
            }
            function writeUTFBytes(view2, offset, string) {
              var lng2 = string.length;
              for (var i2 = 0; i2 < lng2; i2++) {
                view2.setUint8(offset + i2, string.charCodeAt(i2));
              }
            }
            var interleaved;
            if (numberOfAudioChannels2 === 2) {
              interleaved = interleave(leftBuffers, rightBuffers);
            }
            if (numberOfAudioChannels2 === 1) {
              interleaved = leftBuffers;
            }
            var interleavedLength = interleaved.length;
            var resultingBufferLength = 44 + interleavedLength * 2;
            var buffer = new ArrayBuffer(resultingBufferLength);
            var view = new DataView(buffer);
            writeUTFBytes(view, 0, "RIFF");
            view.setUint32(4, 36 + interleavedLength * 2, true);
            writeUTFBytes(view, 8, "WAVE");
            writeUTFBytes(view, 12, "fmt ");
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numberOfAudioChannels2, true);
            view.setUint32(24, sampleRate2, true);
            view.setUint32(28, sampleRate2 * numberOfAudioChannels2 * 2, true);
            view.setUint16(32, numberOfAudioChannels2 * 2, true);
            view.setUint16(34, 16, true);
            writeUTFBytes(view, 36, "data");
            view.setUint32(40, interleavedLength * 2, true);
            var lng = interleavedLength;
            var index = 44;
            var volume = 1;
            for (var i = 0; i < lng; i++) {
              view.setInt16(index, interleaved[i] * (32767 * volume), true);
              index += 2;
            }
            if (cb) {
              return cb({
                buffer,
                view
              });
            }
            postMessage({
              buffer,
              view
            });
          }
          if (config2.noWorker) {
            mergeAudioBuffers(config2, function(data) {
              callback(data.buffer, data.view);
            });
            return;
          }
          var webWorker = processInWebWorker(mergeAudioBuffers);
          webWorker.onmessage = function(event) {
            callback(event.data.buffer, event.data.view);
            URL2.revokeObjectURL(webWorker.workerURL);
            webWorker.terminate();
          };
          webWorker.postMessage(config2);
        }
        function processInWebWorker(_function) {
          var workerURL = URL2.createObjectURL(new Blob([
            _function.toString(),
            ";this.onmessage =  function (eee) {" + _function.name + "(eee.data);}"
          ], {
            type: "application/javascript"
          }));
          var worker = new Worker(workerURL);
          worker.workerURL = workerURL;
          return worker;
        }
        this.stop = function(callback) {
          callback = callback || function() {
          };
          recording = false;
          mergeLeftRightBuffers({
            desiredSampRate,
            sampleRate,
            numberOfAudioChannels,
            internalInterleavedLength: recordingLength,
            leftBuffers: leftchannel,
            rightBuffers: numberOfAudioChannels === 1 ? [] : rightchannel,
            noWorker: config.noWorker
          }, function(buffer, view) {
            self2.blob = new Blob([view], {
              type: "audio/wav"
            });
            self2.buffer = new ArrayBuffer(view.buffer.byteLength);
            self2.view = view;
            self2.sampleRate = desiredSampRate || sampleRate;
            self2.bufferSize = bufferSize;
            self2.length = recordingLength;
            isAudioProcessStarted = false;
            if (callback) {
              callback(self2.blob);
            }
          });
        };
        if (typeof RecordRTC2.Storage === "undefined") {
          RecordRTC2.Storage = {
            AudioContextConstructor: null,
            AudioContext: window.AudioContext || window.webkitAudioContext
          };
        }
        if (!RecordRTC2.Storage.AudioContextConstructor || RecordRTC2.Storage.AudioContextConstructor.state === "closed") {
          RecordRTC2.Storage.AudioContextConstructor = new RecordRTC2.Storage.AudioContext();
        }
        var context = RecordRTC2.Storage.AudioContextConstructor;
        var audioInput = context.createMediaStreamSource(mediaStream);
        var legalBufferValues = [0, 256, 512, 1024, 2048, 4096, 8192, 16384];
        var bufferSize = typeof config.bufferSize === "undefined" ? 4096 : config.bufferSize;
        if (legalBufferValues.indexOf(bufferSize) === -1) {
          if (!config.disableLogs) {
            console.log("Legal values for buffer-size are " + JSON.stringify(legalBufferValues, null, "	"));
          }
        }
        if (context.createJavaScriptNode) {
          jsAudioNode = context.createJavaScriptNode(bufferSize, numberOfAudioChannels, numberOfAudioChannels);
        } else if (context.createScriptProcessor) {
          jsAudioNode = context.createScriptProcessor(bufferSize, numberOfAudioChannels, numberOfAudioChannels);
        } else {
          throw "WebAudio API has no support on this browser.";
        }
        audioInput.connect(jsAudioNode);
        if (!config.bufferSize) {
          bufferSize = jsAudioNode.bufferSize;
        }
        var sampleRate = typeof config.sampleRate !== "undefined" ? config.sampleRate : context.sampleRate || 44100;
        if (sampleRate < 22050 || sampleRate > 96e3) {
          if (!config.disableLogs) {
            console.log("sample-rate must be under range 22050 and 96000.");
          }
        }
        if (!config.disableLogs) {
          if (config.desiredSampRate) {
            console.log("Desired sample-rate: " + config.desiredSampRate);
          }
        }
        var isPaused = false;
        this.pause = function() {
          isPaused = true;
        };
        this.resume = function() {
          if (isMediaStreamActive() === false) {
            throw "Please make sure MediaStream is active.";
          }
          if (!recording) {
            if (!config.disableLogs) {
              console.log("Seems recording has been restarted.");
            }
            this.record();
            return;
          }
          isPaused = false;
        };
        this.clearRecordedData = function() {
          config.checkForInactiveTracks = false;
          if (recording) {
            this.stop(clearRecordedDataCB);
          }
          clearRecordedDataCB();
        };
        function resetVariables() {
          leftchannel = [];
          rightchannel = [];
          recordingLength = 0;
          isAudioProcessStarted = false;
          recording = false;
          isPaused = false;
          context = null;
          self2.leftchannel = leftchannel;
          self2.rightchannel = rightchannel;
          self2.numberOfAudioChannels = numberOfAudioChannels;
          self2.desiredSampRate = desiredSampRate;
          self2.sampleRate = sampleRate;
          self2.recordingLength = recordingLength;
          intervalsBasedBuffers = {
            left: [],
            right: [],
            recordingLength: 0
          };
        }
        function clearRecordedDataCB() {
          if (jsAudioNode) {
            jsAudioNode.onaudioprocess = null;
            jsAudioNode.disconnect();
            jsAudioNode = null;
          }
          if (audioInput) {
            audioInput.disconnect();
            audioInput = null;
          }
          resetVariables();
        }
        this.name = "StereoAudioRecorder";
        this.toString = function() {
          return this.name;
        };
        var isAudioProcessStarted = false;
        function onAudioProcessDataAvailable(e) {
          if (isPaused) {
            return;
          }
          if (isMediaStreamActive() === false) {
            if (!config.disableLogs) {
              console.log("MediaStream seems stopped.");
            }
            jsAudioNode.disconnect();
            recording = false;
          }
          if (!recording) {
            if (audioInput) {
              audioInput.disconnect();
              audioInput = null;
            }
            return;
          }
          if (!isAudioProcessStarted) {
            isAudioProcessStarted = true;
            if (config.onAudioProcessStarted) {
              config.onAudioProcessStarted();
            }
            if (config.initCallback) {
              config.initCallback();
            }
          }
          var left = e.inputBuffer.getChannelData(0);
          var chLeft = new Float32Array(left);
          leftchannel.push(chLeft);
          if (numberOfAudioChannels === 2) {
            var right = e.inputBuffer.getChannelData(1);
            var chRight = new Float32Array(right);
            rightchannel.push(chRight);
          }
          recordingLength += bufferSize;
          self2.recordingLength = recordingLength;
          if (typeof config.timeSlice !== "undefined") {
            intervalsBasedBuffers.recordingLength += bufferSize;
            intervalsBasedBuffers.left.push(chLeft);
            if (numberOfAudioChannels === 2) {
              intervalsBasedBuffers.right.push(chRight);
            }
          }
        }
        jsAudioNode.onaudioprocess = onAudioProcessDataAvailable;
        if (context.createMediaStreamDestination) {
          jsAudioNode.connect(context.createMediaStreamDestination());
        } else {
          jsAudioNode.connect(context.destination);
        }
        this.leftchannel = leftchannel;
        this.rightchannel = rightchannel;
        this.numberOfAudioChannels = numberOfAudioChannels;
        this.desiredSampRate = desiredSampRate;
        this.sampleRate = sampleRate;
        self2.recordingLength = recordingLength;
        var intervalsBasedBuffers = {
          left: [],
          right: [],
          recordingLength: 0
        };
        function looper() {
          if (!recording || typeof config.ondataavailable !== "function" || typeof config.timeSlice === "undefined") {
            return;
          }
          if (intervalsBasedBuffers.left.length) {
            mergeLeftRightBuffers({
              desiredSampRate,
              sampleRate,
              numberOfAudioChannels,
              internalInterleavedLength: intervalsBasedBuffers.recordingLength,
              leftBuffers: intervalsBasedBuffers.left,
              rightBuffers: numberOfAudioChannels === 1 ? [] : intervalsBasedBuffers.right
            }, function(buffer, view) {
              var blob = new Blob([view], {
                type: "audio/wav"
              });
              config.ondataavailable(blob);
              setTimeout(looper, config.timeSlice);
            });
            intervalsBasedBuffers = {
              left: [],
              right: [],
              recordingLength: 0
            };
          } else {
            setTimeout(looper, config.timeSlice);
          }
        }
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.StereoAudioRecorder = StereoAudioRecorder;
      }
      /**
       * CanvasRecorder is a standalone class used by {@link RecordRTC} to bring HTML5-Canvas recording into video WebM. It uses HTML2Canvas library and runs top over {@link Whammy}.
       * @summary HTML2Canvas recording into video WebM.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef CanvasRecorder
       * @class
       * @example
       * var recorder = new CanvasRecorder(htmlElement, { disableLogs: true, useWhammyRecorder: true });
       * recorder.record();
       * recorder.stop(function(blob) {
       *     video.src = URL.createObjectURL(blob);
       * });
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {HTMLElement} htmlElement - querySelector/getElementById/getElementsByTagName[0]/etc.
       * @param {object} config - {disableLogs:true, initCallback: function}
       */
      function CanvasRecorder(htmlElement, config) {
        if (typeof html2canvas === "undefined") {
          throw "Please link: https://www.webrtc-experiment.com/screenshot.js";
        }
        config = config || {};
        if (!config.frameInterval) {
          config.frameInterval = 10;
        }
        var isCanvasSupportsStreamCapturing = false;
        ["captureStream", "mozCaptureStream", "webkitCaptureStream"].forEach(function(item) {
          if (item in document.createElement("canvas")) {
            isCanvasSupportsStreamCapturing = true;
          }
        });
        var _isChrome = (!!window.webkitRTCPeerConnection || !!window.webkitGetUserMedia) && !!window.chrome;
        var chromeVersion = 50;
        var matchArray = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
        if (_isChrome && matchArray && matchArray[2]) {
          chromeVersion = parseInt(matchArray[2], 10);
        }
        if (_isChrome && chromeVersion < 52) {
          isCanvasSupportsStreamCapturing = false;
        }
        if (config.useWhammyRecorder) {
          isCanvasSupportsStreamCapturing = false;
        }
        var globalCanvas, mediaStreamRecorder;
        if (isCanvasSupportsStreamCapturing) {
          if (!config.disableLogs) {
            console.log("Your browser supports both MediRecorder API and canvas.captureStream!");
          }
          if (htmlElement instanceof HTMLCanvasElement) {
            globalCanvas = htmlElement;
          } else if (htmlElement instanceof CanvasRenderingContext2D) {
            globalCanvas = htmlElement.canvas;
          } else {
            throw "Please pass either HTMLCanvasElement or CanvasRenderingContext2D.";
          }
        } else if (!!navigator.mozGetUserMedia) {
          if (!config.disableLogs) {
            console.error("Canvas recording is NOT supported in Firefox.");
          }
        }
        var isRecording;
        this.record = function() {
          isRecording = true;
          if (isCanvasSupportsStreamCapturing && !config.useWhammyRecorder) {
            var canvasMediaStream;
            if ("captureStream" in globalCanvas) {
              canvasMediaStream = globalCanvas.captureStream(25);
            } else if ("mozCaptureStream" in globalCanvas) {
              canvasMediaStream = globalCanvas.mozCaptureStream(25);
            } else if ("webkitCaptureStream" in globalCanvas) {
              canvasMediaStream = globalCanvas.webkitCaptureStream(25);
            }
            try {
              var mdStream = new MediaStream();
              mdStream.addTrack(getTracks(canvasMediaStream, "video")[0]);
              canvasMediaStream = mdStream;
            } catch (e) {
            }
            if (!canvasMediaStream) {
              throw "captureStream API are NOT available.";
            }
            mediaStreamRecorder = new MediaStreamRecorder(canvasMediaStream, {
              mimeType: config.mimeType || "video/webm"
            });
            mediaStreamRecorder.record();
          } else {
            whammy.frames = [];
            lastTime2 = (/* @__PURE__ */ new Date()).getTime();
            drawCanvasFrame();
          }
          if (config.initCallback) {
            config.initCallback();
          }
        };
        this.getWebPImages = function(callback) {
          if (htmlElement.nodeName.toLowerCase() !== "canvas") {
            callback();
            return;
          }
          var framesLength = whammy.frames.length;
          whammy.frames.forEach(function(frame, idx) {
            var framesRemaining = framesLength - idx;
            if (!config.disableLogs) {
              console.log(framesRemaining + "/" + framesLength + " frames remaining");
            }
            if (config.onEncodingCallback) {
              config.onEncodingCallback(framesRemaining, framesLength);
            }
            var webp = frame.image.toDataURL("image/webp", 1);
            whammy.frames[idx].image = webp;
          });
          if (!config.disableLogs) {
            console.log("Generating WebM");
          }
          callback();
        };
        this.stop = function(callback) {
          isRecording = false;
          var that = this;
          if (isCanvasSupportsStreamCapturing && mediaStreamRecorder) {
            mediaStreamRecorder.stop(callback);
            return;
          }
          this.getWebPImages(function() {
            whammy.compile(function(blob) {
              if (!config.disableLogs) {
                console.log("Recording finished!");
              }
              that.blob = blob;
              if (that.blob.forEach) {
                that.blob = new Blob([], {
                  type: "video/webm"
                });
              }
              if (callback) {
                callback(that.blob);
              }
              whammy.frames = [];
            });
          });
        };
        var isPausedRecording = false;
        this.pause = function() {
          isPausedRecording = true;
          if (mediaStreamRecorder instanceof MediaStreamRecorder) {
            mediaStreamRecorder.pause();
            return;
          }
        };
        this.resume = function() {
          isPausedRecording = false;
          if (mediaStreamRecorder instanceof MediaStreamRecorder) {
            mediaStreamRecorder.resume();
            return;
          }
          if (!isRecording) {
            this.record();
          }
        };
        this.clearRecordedData = function() {
          if (isRecording) {
            this.stop(clearRecordedDataCB);
          }
          clearRecordedDataCB();
        };
        function clearRecordedDataCB() {
          whammy.frames = [];
          isRecording = false;
          isPausedRecording = false;
        }
        this.name = "CanvasRecorder";
        this.toString = function() {
          return this.name;
        };
        function cloneCanvas() {
          var newCanvas = document.createElement("canvas");
          var context = newCanvas.getContext("2d");
          newCanvas.width = htmlElement.width;
          newCanvas.height = htmlElement.height;
          context.drawImage(htmlElement, 0, 0);
          return newCanvas;
        }
        function drawCanvasFrame() {
          if (isPausedRecording) {
            lastTime2 = (/* @__PURE__ */ new Date()).getTime();
            return setTimeout(drawCanvasFrame, 500);
          }
          if (htmlElement.nodeName.toLowerCase() === "canvas") {
            var duration = (/* @__PURE__ */ new Date()).getTime() - lastTime2;
            lastTime2 = (/* @__PURE__ */ new Date()).getTime();
            whammy.frames.push({
              image: cloneCanvas(),
              duration
            });
            if (isRecording) {
              setTimeout(drawCanvasFrame, config.frameInterval);
            }
            return;
          }
          html2canvas(htmlElement, {
            grabMouse: typeof config.showMousePointer === "undefined" || config.showMousePointer,
            onrendered: function(canvas) {
              var duration2 = (/* @__PURE__ */ new Date()).getTime() - lastTime2;
              if (!duration2) {
                return setTimeout(drawCanvasFrame, config.frameInterval);
              }
              lastTime2 = (/* @__PURE__ */ new Date()).getTime();
              whammy.frames.push({
                image: canvas.toDataURL("image/webp", 1),
                duration: duration2
              });
              if (isRecording) {
                setTimeout(drawCanvasFrame, config.frameInterval);
              }
            }
          });
        }
        var lastTime2 = (/* @__PURE__ */ new Date()).getTime();
        var whammy = new Whammy.Video(100);
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.CanvasRecorder = CanvasRecorder;
      }
      /**
       * WhammyRecorder is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It runs top over {@link Whammy}.
       * @summary Video recording feature in Chrome.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef WhammyRecorder
       * @class
       * @example
       * var recorder = new WhammyRecorder(mediaStream);
       * recorder.record();
       * recorder.stop(function(blob) {
       *     video.src = URL.createObjectURL(blob);
       * });
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
       * @param {object} config - {disableLogs: true, initCallback: function, video: HTMLVideoElement, etc.}
       */
      function WhammyRecorder(mediaStream, config) {
        config = config || {};
        if (!config.frameInterval) {
          config.frameInterval = 10;
        }
        if (!config.disableLogs) {
          console.log("Using frames-interval:", config.frameInterval);
        }
        this.record = function() {
          if (!config.width) {
            config.width = 320;
          }
          if (!config.height) {
            config.height = 240;
          }
          if (!config.video) {
            config.video = {
              width: config.width,
              height: config.height
            };
          }
          if (!config.canvas) {
            config.canvas = {
              width: config.width,
              height: config.height
            };
          }
          canvas.width = config.canvas.width || 320;
          canvas.height = config.canvas.height || 240;
          context = canvas.getContext("2d");
          if (config.video && config.video instanceof HTMLVideoElement) {
            video = config.video.cloneNode();
            if (config.initCallback) {
              config.initCallback();
            }
          } else {
            video = document.createElement("video");
            setSrcObject(mediaStream, video);
            video.onloadedmetadata = function() {
              if (config.initCallback) {
                config.initCallback();
              }
            };
            video.width = config.video.width;
            video.height = config.video.height;
          }
          video.muted = true;
          video.play();
          lastTime2 = (/* @__PURE__ */ new Date()).getTime();
          whammy = new Whammy.Video();
          if (!config.disableLogs) {
            console.log("canvas resolutions", canvas.width, "*", canvas.height);
            console.log("video width/height", video.width || canvas.width, "*", video.height || canvas.height);
          }
          drawFrames(config.frameInterval);
        };
        function drawFrames(frameInterval) {
          frameInterval = typeof frameInterval !== "undefined" ? frameInterval : 10;
          var duration = (/* @__PURE__ */ new Date()).getTime() - lastTime2;
          if (!duration) {
            return setTimeout(drawFrames, frameInterval, frameInterval);
          }
          if (isPausedRecording) {
            lastTime2 = (/* @__PURE__ */ new Date()).getTime();
            return setTimeout(drawFrames, 100);
          }
          lastTime2 = (/* @__PURE__ */ new Date()).getTime();
          if (video.paused) {
            video.play();
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          whammy.frames.push({
            duration,
            image: canvas.toDataURL("image/webp")
          });
          if (!isStopDrawing) {
            setTimeout(drawFrames, frameInterval, frameInterval);
          }
        }
        function asyncLoop(o) {
          var i = -1, length = o.length;
          (function loop() {
            i++;
            if (i === length) {
              o.callback();
              return;
            }
            setTimeout(function() {
              o.functionToLoop(loop, i);
            }, 1);
          })();
        }
        function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance, callback) {
          var localCanvas = document.createElement("canvas");
          localCanvas.width = canvas.width;
          localCanvas.height = canvas.height;
          var context2d = localCanvas.getContext("2d");
          var resultFrames = [];
          var endCheckFrame = _frames.length;
          var sampleColor = {
            r: 0,
            g: 0,
            b: 0
          };
          var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) + Math.pow(255, 2) + Math.pow(255, 2)
          );
          var pixTolerance = 0;
          var frameTolerance = 0;
          var doNotCheckNext = false;
          asyncLoop({
            length: endCheckFrame,
            functionToLoop: function(loop, f) {
              var matchPixCount, endPixCheck, maxPixCount;
              var finishImage = function() {
                if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) ;
                else {
                  {
                    doNotCheckNext = true;
                  }
                  resultFrames.push(_frames[f]);
                }
                loop();
              };
              if (!doNotCheckNext) {
                var image = new Image();
                image.onload = function() {
                  context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                  var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                  matchPixCount = 0;
                  endPixCheck = imageData.data.length;
                  maxPixCount = imageData.data.length / 4;
                  for (var pix = 0; pix < endPixCheck; pix += 4) {
                    var currentColor = {
                      r: imageData.data[pix],
                      g: imageData.data[pix + 1],
                      b: imageData.data[pix + 2]
                    };
                    var colorDifference = Math.sqrt(
                      Math.pow(currentColor.r - sampleColor.r, 2) + Math.pow(currentColor.g - sampleColor.g, 2) + Math.pow(currentColor.b - sampleColor.b, 2)
                    );
                    if (colorDifference <= maxColorDifference * pixTolerance) {
                      matchPixCount++;
                    }
                  }
                  finishImage();
                };
                image.src = _frames[f].image;
              } else {
                finishImage();
              }
            },
            callback: function() {
              resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));
              if (resultFrames.length <= 0) {
                resultFrames.push(_frames[_frames.length - 1]);
              }
              callback(resultFrames);
            }
          });
        }
        var isStopDrawing = false;
        this.stop = function(callback) {
          callback = callback || function() {
          };
          isStopDrawing = true;
          var _this = this;
          setTimeout(function() {
            dropBlackFrames(whammy.frames, -1, null, null, function(frames) {
              whammy.frames = frames;
              if (config.advertisement && config.advertisement.length) {
                whammy.frames = config.advertisement.concat(whammy.frames);
              }
              whammy.compile(function(blob) {
                _this.blob = blob;
                if (_this.blob.forEach) {
                  _this.blob = new Blob([], {
                    type: "video/webm"
                  });
                }
                if (callback) {
                  callback(_this.blob);
                }
              });
            });
          }, 10);
        };
        var isPausedRecording = false;
        this.pause = function() {
          isPausedRecording = true;
        };
        this.resume = function() {
          isPausedRecording = false;
          if (isStopDrawing) {
            this.record();
          }
        };
        this.clearRecordedData = function() {
          if (!isStopDrawing) {
            this.stop(clearRecordedDataCB);
          }
          clearRecordedDataCB();
        };
        function clearRecordedDataCB() {
          whammy.frames = [];
          isStopDrawing = true;
          isPausedRecording = false;
        }
        this.name = "WhammyRecorder";
        this.toString = function() {
          return this.name;
        };
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var video;
        var lastTime2;
        var whammy;
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.WhammyRecorder = WhammyRecorder;
      }
      /**
       * Whammy is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It is written by {@link https://github.com/antimatter15|antimatter15}
       * @summary A real time javascript webm encoder based on a canvas hack.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef Whammy
       * @class
       * @example
       * var recorder = new Whammy().Video(15);
       * recorder.add(context || canvas || dataURL);
       * var output = recorder.compile();
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       */
      var Whammy = function() {
        function WhammyVideo(duration) {
          this.frames = [];
          this.duration = duration || 1;
          this.quality = 0.8;
        }
        WhammyVideo.prototype.add = function(frame, duration) {
          if ("canvas" in frame) {
            frame = frame.canvas;
          }
          if ("toDataURL" in frame) {
            frame = frame.toDataURL("image/webp", this.quality);
          }
          if (!/^data:image\/webp;base64,/ig.test(frame)) {
            throw "Input must be formatted properly as a base64 encoded DataURI of type image/webp";
          }
          this.frames.push({
            image: frame,
            duration: duration || this.duration
          });
        };
        function processInWebWorker(_function) {
          var blob = URL2.createObjectURL(new Blob([
            _function.toString(),
            "this.onmessage =  function (eee) {" + _function.name + "(eee.data);}"
          ], {
            type: "application/javascript"
          }));
          var worker = new Worker(blob);
          URL2.revokeObjectURL(blob);
          return worker;
        }
        function whammyInWebWorker(frames) {
          function ArrayToWebM(frames2) {
            var info = checkFrames(frames2);
            if (!info) {
              return [];
            }
            var clusterMaxDuration = 3e4;
            var EBML2 = [{
              "id": 440786851,
              // EBML
              "data": [{
                "data": 1,
                "id": 17030
                // EBMLVersion
              }, {
                "data": 1,
                "id": 17143
                // EBMLReadVersion
              }, {
                "data": 4,
                "id": 17138
                // EBMLMaxIDLength
              }, {
                "data": 8,
                "id": 17139
                // EBMLMaxSizeLength
              }, {
                "data": "webm",
                "id": 17026
                // DocType
              }, {
                "data": 2,
                "id": 17031
                // DocTypeVersion
              }, {
                "data": 2,
                "id": 17029
                // DocTypeReadVersion
              }]
            }, {
              "id": 408125543,
              // Segment
              "data": [{
                "id": 357149030,
                // Info
                "data": [{
                  "data": 1e6,
                  //do things in millisecs (num of nanosecs for duration scale)
                  "id": 2807729
                  // TimecodeScale
                }, {
                  "data": "whammy",
                  "id": 19840
                  // MuxingApp
                }, {
                  "data": "whammy",
                  "id": 22337
                  // WritingApp
                }, {
                  "data": doubleToString(info.duration),
                  "id": 17545
                  // Duration
                }]
              }, {
                "id": 374648427,
                // Tracks
                "data": [{
                  "id": 174,
                  // TrackEntry
                  "data": [{
                    "data": 1,
                    "id": 215
                    // TrackNumber
                  }, {
                    "data": 1,
                    "id": 29637
                    // TrackUID
                  }, {
                    "data": 0,
                    "id": 156
                    // FlagLacing
                  }, {
                    "data": "und",
                    "id": 2274716
                    // Language
                  }, {
                    "data": "V_VP8",
                    "id": 134
                    // CodecID
                  }, {
                    "data": "VP8",
                    "id": 2459272
                    // CodecName
                  }, {
                    "data": 1,
                    "id": 131
                    // TrackType
                  }, {
                    "id": 224,
                    // Video
                    "data": [{
                      "data": info.width,
                      "id": 176
                      // PixelWidth
                    }, {
                      "data": info.height,
                      "id": 186
                      // PixelHeight
                    }]
                  }]
                }]
              }]
            }];
            var frameNumber = 0;
            var clusterTimecode = 0;
            while (frameNumber < frames2.length) {
              var clusterFrames = [];
              var clusterDuration = 0;
              do {
                clusterFrames.push(frames2[frameNumber]);
                clusterDuration += frames2[frameNumber].duration;
                frameNumber++;
              } while (frameNumber < frames2.length && clusterDuration < clusterMaxDuration);
              var clusterCounter = 0;
              var cluster = {
                "id": 524531317,
                // Cluster
                "data": getClusterData(clusterTimecode, clusterCounter, clusterFrames)
              };
              EBML2[1].data.push(cluster);
              clusterTimecode += clusterDuration;
            }
            return generateEBML(EBML2);
          }
          function getClusterData(clusterTimecode, clusterCounter, clusterFrames) {
            return [{
              "data": clusterTimecode,
              "id": 231
              // Timecode
            }].concat(clusterFrames.map(function(webp) {
              var block = makeSimpleBlock({
                discardable: 0,
                frame: webp.data.slice(4),
                invisible: 0,
                keyframe: 1,
                lacing: 0,
                trackNum: 1,
                timecode: Math.round(clusterCounter)
              });
              clusterCounter += webp.duration;
              return {
                data: block,
                id: 163
              };
            }));
          }
          function checkFrames(frames2) {
            if (!frames2[0]) {
              postMessage({
                error: "Something went wrong. Maybe WebP format is not supported in the current browser."
              });
              return;
            }
            var width = frames2[0].width, height = frames2[0].height, duration = frames2[0].duration;
            for (var i = 1; i < frames2.length; i++) {
              duration += frames2[i].duration;
            }
            return {
              duration,
              width,
              height
            };
          }
          function numToBuffer(num) {
            var parts = [];
            while (num > 0) {
              parts.push(num & 255);
              num = num >> 8;
            }
            return new Uint8Array(parts.reverse());
          }
          function strToBuffer(str) {
            return new Uint8Array(str.split("").map(function(e) {
              return e.charCodeAt(0);
            }));
          }
          function bitsToBuffer(bits) {
            var data = [];
            var pad = bits.length % 8 ? new Array(1 + 8 - bits.length % 8).join("0") : "";
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
              data.push(parseInt(bits.substr(i, 8), 2));
            }
            return new Uint8Array(data);
          }
          function generateEBML(json) {
            var ebml = [];
            for (var i = 0; i < json.length; i++) {
              var data = json[i].data;
              if (typeof data === "object") {
                data = generateEBML(data);
              }
              if (typeof data === "number") {
                data = bitsToBuffer(data.toString(2));
              }
              if (typeof data === "string") {
                data = strToBuffer(data);
              }
              var len = data.size || data.byteLength || data.length;
              var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
              var sizeToString = len.toString(2);
              var padded = new Array(zeroes * 7 + 7 + 1 - sizeToString.length).join("0") + sizeToString;
              var size = new Array(zeroes).join("0") + "1" + padded;
              ebml.push(numToBuffer(json[i].id));
              ebml.push(bitsToBuffer(size));
              ebml.push(data);
            }
            return new Blob(ebml, {
              type: "video/webm"
            });
          }
          function makeSimpleBlock(data) {
            var flags = 0;
            {
              flags |= 128;
            }
            if (data.trackNum > 127) {
              throw "TrackNumber > 127 not supported";
            }
            var out = [data.trackNum | 128, data.timecode >> 8, data.timecode & 255, flags].map(function(e) {
              return String.fromCharCode(e);
            }).join("") + data.frame;
            return out;
          }
          function parseWebP(riff) {
            var VP8 = riff.RIFF[0].WEBP[0];
            var frameStart = VP8.indexOf("*");
            for (var i = 0, c = []; i < 4; i++) {
              c[i] = VP8.charCodeAt(frameStart + 3 + i);
            }
            var width, height, tmp;
            tmp = c[1] << 8 | c[0];
            width = tmp & 16383;
            tmp = c[3] << 8 | c[2];
            height = tmp & 16383;
            return {
              width,
              height,
              data: VP8,
              riff
            };
          }
          function getStrLength(string, offset) {
            return parseInt(string.substr(offset + 4, 4).split("").map(function(i) {
              var unpadded = i.charCodeAt(0).toString(2);
              return new Array(8 - unpadded.length + 1).join("0") + unpadded;
            }).join(""), 2);
          }
          function parseRIFF(string) {
            var offset = 0;
            var chunks = {};
            while (offset < string.length) {
              var id = string.substr(offset, 4);
              var len = getStrLength(string, offset);
              var data = string.substr(offset + 4 + 4, len);
              offset += 4 + 4 + len;
              chunks[id] = chunks[id] || [];
              if (id === "RIFF" || id === "LIST") {
                chunks[id].push(parseRIFF(data));
              } else {
                chunks[id].push(data);
              }
            }
            return chunks;
          }
          function doubleToString(num) {
            return [].slice.call(
              new Uint8Array(new Float64Array([num]).buffer),
              0
            ).map(function(e) {
              return String.fromCharCode(e);
            }).reverse().join("");
          }
          var webm = new ArrayToWebM(frames.map(function(frame) {
            var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
            webp.duration = frame.duration;
            return webp;
          }));
          postMessage(webm);
        }
        WhammyVideo.prototype.compile = function(callback) {
          var webWorker = processInWebWorker(whammyInWebWorker);
          webWorker.onmessage = function(event) {
            if (event.data.error) {
              console.error(event.data.error);
              return;
            }
            callback(event.data);
          };
          webWorker.postMessage(this.frames);
        };
        return {
          /**
           * A more abstract-ish API.
           * @method
           * @memberof Whammy
           * @example
           * recorder = new Whammy().Video(0.8, 100);
           * @param {?number} speed - 0.8
           * @param {?number} quality - 100
           */
          Video: WhammyVideo
        };
      }();
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.Whammy = Whammy;
      }
      /**
       * DiskStorage is a standalone object used by {@link RecordRTC} to store recorded blobs in IndexedDB storage.
       * @summary Writing blobs into IndexedDB.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @example
       * DiskStorage.Store({
       *     audioBlob: yourAudioBlob,
       *     videoBlob: yourVideoBlob,
       *     gifBlob  : yourGifBlob
       * });
       * DiskStorage.Fetch(function(dataURL, type) {
       *     if(type === 'audioBlob') { }
       *     if(type === 'videoBlob') { }
       *     if(type === 'gifBlob')   { }
       * });
       * // DiskStorage.dataStoreName = 'recordRTC';
       * // DiskStorage.onError = function(error) { };
       * @property {function} init - This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
       * @property {function} Fetch - This method fetches stored blobs from IndexedDB.
       * @property {function} Store - This method stores blobs in IndexedDB.
       * @property {function} onError - This function is invoked for any known/unknown error.
       * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       */
      var DiskStorage = {
        /**
         * This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
         * @method
         * @memberof DiskStorage
         * @internal
         * @example
         * DiskStorage.init();
         */
        init: function() {
          var self2 = this;
          if (typeof indexedDB === "undefined" || typeof indexedDB.open === "undefined") {
            console.error("IndexedDB API are not available in this browser.");
            return;
          }
          var dbVersion = 1;
          var dbName = this.dbName || location.href.replace(/\/|:|#|%|\.|\[|\]/g, ""), db;
          var request = indexedDB.open(dbName, dbVersion);
          function createObjectStore(dataBase) {
            dataBase.createObjectStore(self2.dataStoreName);
          }
          function putInDB() {
            var transaction = db.transaction([self2.dataStoreName], "readwrite");
            if (self2.videoBlob) {
              transaction.objectStore(self2.dataStoreName).put(self2.videoBlob, "videoBlob");
            }
            if (self2.gifBlob) {
              transaction.objectStore(self2.dataStoreName).put(self2.gifBlob, "gifBlob");
            }
            if (self2.audioBlob) {
              transaction.objectStore(self2.dataStoreName).put(self2.audioBlob, "audioBlob");
            }
            function getFromStore(portionName) {
              transaction.objectStore(self2.dataStoreName).get(portionName).onsuccess = function(event) {
                if (self2.callback) {
                  self2.callback(event.target.result, portionName);
                }
              };
            }
            getFromStore("audioBlob");
            getFromStore("videoBlob");
            getFromStore("gifBlob");
          }
          request.onerror = self2.onError;
          request.onsuccess = function() {
            db = request.result;
            db.onerror = self2.onError;
            if (db.setVersion) {
              if (db.version !== dbVersion) {
                var setVersion = db.setVersion(dbVersion);
                setVersion.onsuccess = function() {
                  createObjectStore(db);
                  putInDB();
                };
              } else {
                putInDB();
              }
            } else {
              putInDB();
            }
          };
          request.onupgradeneeded = function(event) {
            createObjectStore(event.target.result);
          };
        },
        /**
         * This method fetches stored blobs from IndexedDB.
         * @method
         * @memberof DiskStorage
         * @internal
         * @example
         * DiskStorage.Fetch(function(dataURL, type) {
         *     if(type === 'audioBlob') { }
         *     if(type === 'videoBlob') { }
         *     if(type === 'gifBlob')   { }
         * });
         */
        Fetch: function(callback) {
          this.callback = callback;
          this.init();
          return this;
        },
        /**
         * This method stores blobs in IndexedDB.
         * @method
         * @memberof DiskStorage
         * @internal
         * @example
         * DiskStorage.Store({
         *     audioBlob: yourAudioBlob,
         *     videoBlob: yourVideoBlob,
         *     gifBlob  : yourGifBlob
         * });
         */
        Store: function(config) {
          this.audioBlob = config.audioBlob;
          this.videoBlob = config.videoBlob;
          this.gifBlob = config.gifBlob;
          this.init();
          return this;
        },
        /**
         * This function is invoked for any known/unknown error.
         * @method
         * @memberof DiskStorage
         * @internal
         * @example
         * DiskStorage.onError = function(error){
         *     alerot( JSON.stringify(error) );
         * };
         */
        onError: function(error) {
          console.error(JSON.stringify(error, null, "	"));
        },
        /**
         * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
         * @memberof DiskStorage
         * @internal
         * @example
         * DiskStorage.dataStoreName = 'recordRTC';
         */
        dataStoreName: "recordRTC",
        dbName: null
      };
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.DiskStorage = DiskStorage;
      }
      /**
       * GifRecorder is standalone calss used by {@link RecordRTC} to record video or canvas into animated gif.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef GifRecorder
       * @class
       * @example
       * var recorder = new GifRecorder(mediaStream || canvas || context, { onGifPreview: function, onGifRecordingStarted: function, width: 1280, height: 720, frameRate: 200, quality: 10 });
       * recorder.record();
       * recorder.stop(function(blob) {
       *     img.src = URL.createObjectURL(blob);
       * });
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object or HTMLCanvasElement or CanvasRenderingContext2D.
       * @param {object} config - {disableLogs:true, initCallback: function, width: 320, height: 240, frameRate: 200, quality: 10}
       */
      function GifRecorder(mediaStream, config) {
        if (typeof GIFEncoder === "undefined") {
          var script = document.createElement("script");
          script.src = "https://www.webrtc-experiment.com/gif-recorder.js";
          (document.body || document.documentElement).appendChild(script);
        }
        config = config || {};
        var isHTMLObject = mediaStream instanceof CanvasRenderingContext2D || mediaStream instanceof HTMLCanvasElement;
        this.record = function() {
          if (typeof GIFEncoder === "undefined") {
            setTimeout(self2.record, 1e3);
            return;
          }
          if (!isLoadedMetaData) {
            setTimeout(self2.record, 1e3);
            return;
          }
          if (!isHTMLObject) {
            if (!config.width) {
              config.width = video.offsetWidth || 320;
            }
            if (!config.height) {
              config.height = video.offsetHeight || 240;
            }
            if (!config.video) {
              config.video = {
                width: config.width,
                height: config.height
              };
            }
            if (!config.canvas) {
              config.canvas = {
                width: config.width,
                height: config.height
              };
            }
            canvas.width = config.canvas.width || 320;
            canvas.height = config.canvas.height || 240;
            video.width = config.video.width || 320;
            video.height = config.video.height || 240;
          }
          gifEncoder = new GIFEncoder();
          gifEncoder.setRepeat(0);
          gifEncoder.setDelay(config.frameRate || 200);
          gifEncoder.setQuality(config.quality || 10);
          gifEncoder.start();
          if (typeof config.onGifRecordingStarted === "function") {
            config.onGifRecordingStarted();
          }
          function drawVideoFrame(time) {
            if (self2.clearedRecordedData === true) {
              return;
            }
            if (isPausedRecording) {
              return setTimeout(function() {
                drawVideoFrame(time);
              }, 100);
            }
            lastAnimationFrame = requestAnimationFrame2(drawVideoFrame);
            if (typeof lastFrameTime === void 0) {
              lastFrameTime = time;
            }
            if (time - lastFrameTime < 90) {
              return;
            }
            if (!isHTMLObject && video.paused) {
              video.play();
            }
            if (!isHTMLObject) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            if (config.onGifPreview) {
              config.onGifPreview(canvas.toDataURL("image/png"));
            }
            gifEncoder.addFrame(context);
            lastFrameTime = time;
          }
          lastAnimationFrame = requestAnimationFrame2(drawVideoFrame);
          if (config.initCallback) {
            config.initCallback();
          }
        };
        this.stop = function(callback) {
          callback = callback || function() {
          };
          if (lastAnimationFrame) {
            cancelAnimationFrame2(lastAnimationFrame);
          }
          this.blob = new Blob([new Uint8Array(gifEncoder.stream().bin)], {
            type: "image/gif"
          });
          callback(this.blob);
          gifEncoder.stream().bin = [];
        };
        var isPausedRecording = false;
        this.pause = function() {
          isPausedRecording = true;
        };
        this.resume = function() {
          isPausedRecording = false;
        };
        this.clearRecordedData = function() {
          self2.clearedRecordedData = true;
          clearRecordedDataCB();
        };
        function clearRecordedDataCB() {
          if (gifEncoder) {
            gifEncoder.stream().bin = [];
          }
        }
        this.name = "GifRecorder";
        this.toString = function() {
          return this.name;
        };
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        if (isHTMLObject) {
          if (mediaStream instanceof CanvasRenderingContext2D) {
            context = mediaStream;
            canvas = context.canvas;
          } else if (mediaStream instanceof HTMLCanvasElement) {
            context = mediaStream.getContext("2d");
            canvas = mediaStream;
          }
        }
        var isLoadedMetaData = true;
        if (!isHTMLObject) {
          var video = document.createElement("video");
          video.muted = true;
          video.autoplay = true;
          video.playsInline = true;
          isLoadedMetaData = false;
          video.onloadedmetadata = function() {
            isLoadedMetaData = true;
          };
          setSrcObject(mediaStream, video);
          video.play();
        }
        var lastAnimationFrame = null;
        var lastFrameTime;
        var gifEncoder;
        var self2 = this;
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.GifRecorder = GifRecorder;
      }
      function MultiStreamsMixer(arrayOfMediaStreams, elementClass) {
        var browserFakeUserAgent2 = "Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45";
        (function(that) {
          if (typeof RecordRTC2 !== "undefined") {
            return;
          }
          if (!that) {
            return;
          }
          if (typeof window !== "undefined") {
            return;
          }
          if (typeof commonjsGlobal === "undefined") {
            return;
          }
          commonjsGlobal.navigator = {
            userAgent: browserFakeUserAgent2,
            getUserMedia: function() {
            }
          };
          if (!commonjsGlobal.console) {
            commonjsGlobal.console = {};
          }
          if (typeof commonjsGlobal.console.log === "undefined" || typeof commonjsGlobal.console.error === "undefined") {
            commonjsGlobal.console.error = commonjsGlobal.console.log = commonjsGlobal.console.log || function() {
              console.log(arguments);
            };
          }
          if (typeof document === "undefined") {
            that.document = {
              documentElement: {
                appendChild: function() {
                  return "";
                }
              }
            };
            document.createElement = document.captureStream = document.mozCaptureStream = function() {
              var obj = {
                getContext: function() {
                  return obj;
                },
                play: function() {
                },
                pause: function() {
                },
                drawImage: function() {
                },
                toDataURL: function() {
                  return "";
                },
                style: {}
              };
              return obj;
            };
            that.HTMLVideoElement = function() {
            };
          }
          if (typeof location === "undefined") {
            that.location = {
              protocol: "file:",
              href: "",
              hash: ""
            };
          }
          if (typeof screen === "undefined") {
            that.screen = {
              width: 0,
              height: 0
            };
          }
          if (typeof URL3 === "undefined") {
            that.URL = {
              createObjectURL: function() {
                return "";
              },
              revokeObjectURL: function() {
                return "";
              }
            };
          }
          that.window = commonjsGlobal;
        })(typeof commonjsGlobal !== "undefined" ? commonjsGlobal : null);
        elementClass = elementClass || "multi-streams-mixer";
        var videos = [];
        var isStopDrawingFrames = false;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        canvas.style.opacity = 0;
        canvas.style.position = "absolute";
        canvas.style.zIndex = -1;
        canvas.style.top = "-1000em";
        canvas.style.left = "-1000em";
        canvas.className = elementClass;
        (document.body || document.documentElement).appendChild(canvas);
        this.disableLogs = false;
        this.frameInterval = 10;
        this.width = 360;
        this.height = 240;
        this.useGainNode = true;
        var self2 = this;
        var AudioContext2 = window.AudioContext;
        if (typeof AudioContext2 === "undefined") {
          if (typeof webkitAudioContext !== "undefined") {
            AudioContext2 = webkitAudioContext;
          }
          if (typeof mozAudioContext !== "undefined") {
            AudioContext2 = mozAudioContext;
          }
        }
        var URL3 = window.URL;
        if (typeof URL3 === "undefined" && typeof webkitURL !== "undefined") {
          URL3 = webkitURL;
        }
        if (typeof navigator !== "undefined" && typeof navigator.getUserMedia === "undefined") {
          if (typeof navigator.webkitGetUserMedia !== "undefined") {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
          }
          if (typeof navigator.mozGetUserMedia !== "undefined") {
            navigator.getUserMedia = navigator.mozGetUserMedia;
          }
        }
        var MediaStream2 = window.MediaStream;
        if (typeof MediaStream2 === "undefined" && typeof webkitMediaStream !== "undefined") {
          MediaStream2 = webkitMediaStream;
        }
        if (typeof MediaStream2 !== "undefined") {
          if (typeof MediaStream2.prototype.stop === "undefined") {
            MediaStream2.prototype.stop = function() {
              this.getTracks().forEach(function(track) {
                track.stop();
              });
            };
          }
        }
        var Storage2 = {};
        if (typeof AudioContext2 !== "undefined") {
          Storage2.AudioContext = AudioContext2;
        } else if (typeof webkitAudioContext !== "undefined") {
          Storage2.AudioContext = webkitAudioContext;
        }
        function setSrcObject2(stream, element) {
          if ("srcObject" in element) {
            element.srcObject = stream;
          } else if ("mozSrcObject" in element) {
            element.mozSrcObject = stream;
          } else {
            element.srcObject = stream;
          }
        }
        this.startDrawingFrames = function() {
          drawVideosToCanvas();
        };
        function drawVideosToCanvas() {
          if (isStopDrawingFrames) {
            return;
          }
          var videosLength = videos.length;
          var fullcanvas = false;
          var remaining = [];
          videos.forEach(function(video) {
            if (!video.stream) {
              video.stream = {};
            }
            if (video.stream.fullcanvas) {
              fullcanvas = video;
            } else {
              remaining.push(video);
            }
          });
          if (fullcanvas) {
            canvas.width = fullcanvas.stream.width;
            canvas.height = fullcanvas.stream.height;
          } else if (remaining.length) {
            canvas.width = videosLength > 1 ? remaining[0].width * 2 : remaining[0].width;
            var height = 1;
            if (videosLength === 3 || videosLength === 4) {
              height = 2;
            }
            if (videosLength === 5 || videosLength === 6) {
              height = 3;
            }
            if (videosLength === 7 || videosLength === 8) {
              height = 4;
            }
            if (videosLength === 9 || videosLength === 10) {
              height = 5;
            }
            canvas.height = remaining[0].height * height;
          } else {
            canvas.width = self2.width || 360;
            canvas.height = self2.height || 240;
          }
          if (fullcanvas && fullcanvas instanceof HTMLVideoElement) {
            drawImage(fullcanvas);
          }
          remaining.forEach(function(video, idx) {
            drawImage(video, idx);
          });
          setTimeout(drawVideosToCanvas, self2.frameInterval);
        }
        function drawImage(video, idx) {
          if (isStopDrawingFrames) {
            return;
          }
          var x = 0;
          var y = 0;
          var width = video.width;
          var height = video.height;
          if (idx === 1) {
            x = video.width;
          }
          if (idx === 2) {
            y = video.height;
          }
          if (idx === 3) {
            x = video.width;
            y = video.height;
          }
          if (idx === 4) {
            y = video.height * 2;
          }
          if (idx === 5) {
            x = video.width;
            y = video.height * 2;
          }
          if (idx === 6) {
            y = video.height * 3;
          }
          if (idx === 7) {
            x = video.width;
            y = video.height * 3;
          }
          if (typeof video.stream.left !== "undefined") {
            x = video.stream.left;
          }
          if (typeof video.stream.top !== "undefined") {
            y = video.stream.top;
          }
          if (typeof video.stream.width !== "undefined") {
            width = video.stream.width;
          }
          if (typeof video.stream.height !== "undefined") {
            height = video.stream.height;
          }
          context.drawImage(video, x, y, width, height);
          if (typeof video.stream.onRender === "function") {
            video.stream.onRender(context, x, y, width, height, idx);
          }
        }
        function getMixedStream() {
          isStopDrawingFrames = false;
          var mixedVideoStream = getMixedVideoStream();
          var mixedAudioStream = getMixedAudioStream();
          if (mixedAudioStream) {
            mixedAudioStream.getTracks().filter(function(t) {
              return t.kind === "audio";
            }).forEach(function(track) {
              mixedVideoStream.addTrack(track);
            });
          }
          arrayOfMediaStreams.forEach(function(stream) {
            if (stream.fullcanvas) ;
          });
          return mixedVideoStream;
        }
        function getMixedVideoStream() {
          resetVideoStreams();
          var capturedStream;
          if ("captureStream" in canvas) {
            capturedStream = canvas.captureStream();
          } else if ("mozCaptureStream" in canvas) {
            capturedStream = canvas.mozCaptureStream();
          } else if (!self2.disableLogs) {
            console.error("Upgrade to latest Chrome or otherwise enable this flag: chrome://flags/#enable-experimental-web-platform-features");
          }
          var videoStream = new MediaStream2();
          capturedStream.getTracks().filter(function(t) {
            return t.kind === "video";
          }).forEach(function(track) {
            videoStream.addTrack(track);
          });
          canvas.stream = videoStream;
          return videoStream;
        }
        function getMixedAudioStream() {
          if (!Storage2.AudioContextConstructor) {
            Storage2.AudioContextConstructor = new Storage2.AudioContext();
          }
          self2.audioContext = Storage2.AudioContextConstructor;
          self2.audioSources = [];
          if (self2.useGainNode === true) {
            self2.gainNode = self2.audioContext.createGain();
            self2.gainNode.connect(self2.audioContext.destination);
            self2.gainNode.gain.value = 0;
          }
          var audioTracksLength = 0;
          arrayOfMediaStreams.forEach(function(stream) {
            if (!stream.getTracks().filter(function(t) {
              return t.kind === "audio";
            }).length) {
              return;
            }
            audioTracksLength++;
            var audioSource = self2.audioContext.createMediaStreamSource(stream);
            if (self2.useGainNode === true) {
              audioSource.connect(self2.gainNode);
            }
            self2.audioSources.push(audioSource);
          });
          if (!audioTracksLength) {
            return;
          }
          self2.audioDestination = self2.audioContext.createMediaStreamDestination();
          self2.audioSources.forEach(function(audioSource) {
            audioSource.connect(self2.audioDestination);
          });
          return self2.audioDestination.stream;
        }
        function getVideo(stream) {
          var video = document.createElement("video");
          setSrcObject2(stream, video);
          video.className = elementClass;
          video.muted = true;
          video.volume = 0;
          video.width = stream.width || self2.width || 360;
          video.height = stream.height || self2.height || 240;
          video.play();
          return video;
        }
        this.appendStreams = function(streams) {
          if (!streams) {
            throw "First parameter is required.";
          }
          if (!(streams instanceof Array)) {
            streams = [streams];
          }
          streams.forEach(function(stream) {
            var newStream = new MediaStream2();
            if (stream.getTracks().filter(function(t) {
              return t.kind === "video";
            }).length) {
              var video = getVideo(stream);
              video.stream = stream;
              videos.push(video);
              newStream.addTrack(stream.getTracks().filter(function(t) {
                return t.kind === "video";
              })[0]);
            }
            if (stream.getTracks().filter(function(t) {
              return t.kind === "audio";
            }).length) {
              var audioSource = self2.audioContext.createMediaStreamSource(stream);
              self2.audioDestination = self2.audioContext.createMediaStreamDestination();
              audioSource.connect(self2.audioDestination);
              newStream.addTrack(self2.audioDestination.stream.getTracks().filter(function(t) {
                return t.kind === "audio";
              })[0]);
            }
            arrayOfMediaStreams.push(newStream);
          });
        };
        this.releaseStreams = function() {
          videos = [];
          isStopDrawingFrames = true;
          if (self2.gainNode) {
            self2.gainNode.disconnect();
            self2.gainNode = null;
          }
          if (self2.audioSources.length) {
            self2.audioSources.forEach(function(source) {
              source.disconnect();
            });
            self2.audioSources = [];
          }
          if (self2.audioDestination) {
            self2.audioDestination.disconnect();
            self2.audioDestination = null;
          }
          if (self2.audioContext) {
            self2.audioContext.close();
          }
          self2.audioContext = null;
          context.clearRect(0, 0, canvas.width, canvas.height);
          if (canvas.stream) {
            canvas.stream.stop();
            canvas.stream = null;
          }
        };
        this.resetVideoStreams = function(streams) {
          if (streams && !(streams instanceof Array)) {
            streams = [streams];
          }
          resetVideoStreams(streams);
        };
        function resetVideoStreams(streams) {
          videos = [];
          streams = streams || arrayOfMediaStreams;
          streams.forEach(function(stream) {
            if (!stream.getTracks().filter(function(t) {
              return t.kind === "video";
            }).length) {
              return;
            }
            var video = getVideo(stream);
            video.stream = stream;
            videos.push(video);
          });
        }
        this.name = "MultiStreamsMixer";
        this.toString = function() {
          return this.name;
        };
        this.getMixedStream = getMixedStream;
      }
      if (typeof RecordRTC2 === "undefined") {
        {
          module.exports = MultiStreamsMixer;
        }
      }
      /**
       * MultiStreamRecorder can record multiple videos in single container.
       * @summary Multi-videos recorder.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef MultiStreamRecorder
       * @class
       * @example
       * var options = {
       *     mimeType: 'video/webm'
       * }
       * var recorder = new MultiStreamRecorder(ArrayOfMediaStreams, options);
       * recorder.record();
       * recorder.stop(function(blob) {
       *     video.src = URL.createObjectURL(blob);
       *
       *     // or
       *     var blob = recorder.blob;
       * });
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStreams} mediaStreams - Array of MediaStreams.
       * @param {object} config - {disableLogs:true, frameInterval: 1, mimeType: "video/webm"}
       */
      function MultiStreamRecorder(arrayOfMediaStreams, options) {
        arrayOfMediaStreams = arrayOfMediaStreams || [];
        var self2 = this;
        var mixer;
        var mediaRecorder;
        options = options || {
          elementClass: "multi-streams-mixer",
          mimeType: "video/webm",
          video: {
            width: 360,
            height: 240
          }
        };
        if (!options.frameInterval) {
          options.frameInterval = 10;
        }
        if (!options.video) {
          options.video = {};
        }
        if (!options.video.width) {
          options.video.width = 360;
        }
        if (!options.video.height) {
          options.video.height = 240;
        }
        this.record = function() {
          mixer = new MultiStreamsMixer(arrayOfMediaStreams, options.elementClass || "multi-streams-mixer");
          if (getAllVideoTracks().length) {
            mixer.frameInterval = options.frameInterval || 10;
            mixer.width = options.video.width || 360;
            mixer.height = options.video.height || 240;
            mixer.startDrawingFrames();
          }
          if (options.previewStream && typeof options.previewStream === "function") {
            options.previewStream(mixer.getMixedStream());
          }
          mediaRecorder = new MediaStreamRecorder(mixer.getMixedStream(), options);
          mediaRecorder.record();
        };
        function getAllVideoTracks() {
          var tracks = [];
          arrayOfMediaStreams.forEach(function(stream) {
            getTracks(stream, "video").forEach(function(track) {
              tracks.push(track);
            });
          });
          return tracks;
        }
        this.stop = function(callback) {
          if (!mediaRecorder) {
            return;
          }
          mediaRecorder.stop(function(blob) {
            self2.blob = blob;
            callback(blob);
            self2.clearRecordedData();
          });
        };
        this.pause = function() {
          if (mediaRecorder) {
            mediaRecorder.pause();
          }
        };
        this.resume = function() {
          if (mediaRecorder) {
            mediaRecorder.resume();
          }
        };
        this.clearRecordedData = function() {
          if (mediaRecorder) {
            mediaRecorder.clearRecordedData();
            mediaRecorder = null;
          }
          if (mixer) {
            mixer.releaseStreams();
            mixer = null;
          }
        };
        this.addStreams = function(streams) {
          if (!streams) {
            throw "First parameter is required.";
          }
          if (!(streams instanceof Array)) {
            streams = [streams];
          }
          arrayOfMediaStreams.concat(streams);
          if (!mediaRecorder || !mixer) {
            return;
          }
          mixer.appendStreams(streams);
          if (options.previewStream && typeof options.previewStream === "function") {
            options.previewStream(mixer.getMixedStream());
          }
        };
        this.resetVideoStreams = function(streams) {
          if (!mixer) {
            return;
          }
          if (streams && !(streams instanceof Array)) {
            streams = [streams];
          }
          mixer.resetVideoStreams(streams);
        };
        this.getMixer = function() {
          return mixer;
        };
        this.name = "MultiStreamRecorder";
        this.toString = function() {
          return this.name;
        };
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.MultiStreamRecorder = MultiStreamRecorder;
      }
      /**
       * RecordRTCPromisesHandler adds promises support in {@link RecordRTC}. Try a {@link https://github.com/muaz-khan/RecordRTC/blob/master/simple-demos/RecordRTCPromisesHandler.html|demo here}
       * @summary Promises for {@link RecordRTC}
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef RecordRTCPromisesHandler
       * @class
       * @example
       * var recorder = new RecordRTCPromisesHandler(mediaStream, options);
       * recorder.startRecording()
       *         .then(successCB)
       *         .catch(errorCB);
       * // Note: You can access all RecordRTC API using "recorder.recordRTC" e.g. 
       * recorder.recordRTC.onStateChanged = function(state) {};
       * recorder.recordRTC.setRecordingDuration(5000);
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - Single media-stream object, array of media-streams, html-canvas-element, etc.
       * @param {object} config - {type:"video", recorderType: MediaStreamRecorder, disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, etc.}
       * @throws Will throw an error if "new" keyword is not used to initiate "RecordRTCPromisesHandler". Also throws error if first argument "MediaStream" is missing.
       * @requires {@link RecordRTC}
       */
      function RecordRTCPromisesHandler(mediaStream, options) {
        if (!this) {
          throw 'Use "new RecordRTCPromisesHandler()"';
        }
        if (typeof mediaStream === "undefined") {
          throw 'First argument "MediaStream" is required.';
        }
        var self2 = this;
        self2.recordRTC = new RecordRTC2(mediaStream, options);
        this.startRecording = function() {
          return new Promise(function(resolve, reject) {
            try {
              self2.recordRTC.startRecording();
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        };
        this.stopRecording = function() {
          return new Promise(function(resolve, reject) {
            try {
              self2.recordRTC.stopRecording(function(url) {
                self2.blob = self2.recordRTC.getBlob();
                if (!self2.blob || !self2.blob.size) {
                  reject("Empty blob.", self2.blob);
                  return;
                }
                resolve(url);
              });
            } catch (e) {
              reject(e);
            }
          });
        };
        this.pauseRecording = function() {
          return new Promise(function(resolve, reject) {
            try {
              self2.recordRTC.pauseRecording();
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        };
        this.resumeRecording = function() {
          return new Promise(function(resolve, reject) {
            try {
              self2.recordRTC.resumeRecording();
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        };
        this.getDataURL = function(callback) {
          return new Promise(function(resolve, reject) {
            try {
              self2.recordRTC.getDataURL(function(dataURL) {
                resolve(dataURL);
              });
            } catch (e) {
              reject(e);
            }
          });
        };
        this.getBlob = function() {
          return new Promise(function(resolve, reject) {
            try {
              resolve(self2.recordRTC.getBlob());
            } catch (e) {
              reject(e);
            }
          });
        };
        this.getInternalRecorder = function() {
          return new Promise(function(resolve, reject) {
            try {
              resolve(self2.recordRTC.getInternalRecorder());
            } catch (e) {
              reject(e);
            }
          });
        };
        this.reset = function() {
          return new Promise(function(resolve, reject) {
            try {
              resolve(self2.recordRTC.reset());
            } catch (e) {
              reject(e);
            }
          });
        };
        this.destroy = function() {
          return new Promise(function(resolve, reject) {
            try {
              resolve(self2.recordRTC.destroy());
            } catch (e) {
              reject(e);
            }
          });
        };
        this.getState = function() {
          return new Promise(function(resolve, reject) {
            try {
              resolve(self2.recordRTC.getState());
            } catch (e) {
              reject(e);
            }
          });
        };
        this.blob = null;
        this.version = "5.6.2";
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.RecordRTCPromisesHandler = RecordRTCPromisesHandler;
      }
      /**
       * WebAssemblyRecorder lets you create webm videos in JavaScript via WebAssembly. The library consumes raw RGBA32 buffers (4 bytes per pixel) and turns them into a webm video with the given framerate and quality. This makes it compatible out-of-the-box with ImageData from a CANVAS. With realtime mode you can also use webm-wasm for streaming webm videos.
       * @summary Video recording feature in Chrome, Firefox and maybe Edge.
       * @license {@link https://github.com/muaz-khan/RecordRTC/blob/master/LICENSE|MIT}
       * @author {@link https://MuazKhan.com|Muaz Khan}
       * @typedef WebAssemblyRecorder
       * @class
       * @example
       * var recorder = new WebAssemblyRecorder(mediaStream);
       * recorder.record();
       * recorder.stop(function(blob) {
       *     video.src = URL.createObjectURL(blob);
       * });
       * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
       * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
       * @param {object} config - {webAssemblyPath:'webm-wasm.wasm',workerPath: 'webm-worker.js', frameRate: 30, width: 1920, height: 1080, bitrate: 1024, realtime: true}
       */
      function WebAssemblyRecorder(stream, config) {
        if (typeof ReadableStream === "undefined" || typeof WritableStream === "undefined") {
          console.error("Following polyfill is strongly recommended: https://unpkg.com/@mattiasbuelens/web-streams-polyfill/dist/polyfill.min.js");
        }
        config = config || {};
        config.width = config.width || 640;
        config.height = config.height || 480;
        config.frameRate = config.frameRate || 30;
        config.bitrate = config.bitrate || 1200;
        config.realtime = config.realtime || true;
        var finished;
        function cameraStream() {
          return new ReadableStream({
            start: function(controller) {
              var cvs = document.createElement("canvas");
              var video = document.createElement("video");
              var first = true;
              video.srcObject = stream;
              video.muted = true;
              video.height = config.height;
              video.width = config.width;
              video.volume = 0;
              video.onplaying = function() {
                cvs.width = config.width;
                cvs.height = config.height;
                var ctx = cvs.getContext("2d");
                var frameTimeout = 1e3 / config.frameRate;
                var cameraTimer = setInterval(function f() {
                  if (finished) {
                    clearInterval(cameraTimer);
                    controller.close();
                  }
                  if (first) {
                    first = false;
                    if (config.onVideoProcessStarted) {
                      config.onVideoProcessStarted();
                    }
                  }
                  ctx.drawImage(video, 0, 0);
                  if (controller._controlledReadableStream.state !== "closed") {
                    try {
                      controller.enqueue(
                        ctx.getImageData(0, 0, config.width, config.height)
                      );
                    } catch (e) {
                    }
                  }
                }, frameTimeout);
              };
              video.play();
            }
          });
        }
        var worker;
        function startRecording(stream2, buffer) {
          if (!config.workerPath && !buffer) {
            finished = false;
            fetch(
              "https://unpkg.com/webm-wasm@latest/dist/webm-worker.js"
            ).then(function(r) {
              r.arrayBuffer().then(function(buffer2) {
                startRecording(stream2, buffer2);
              });
            });
            return;
          }
          if (!config.workerPath && buffer instanceof ArrayBuffer) {
            var blob = new Blob([buffer], {
              type: "text/javascript"
            });
            config.workerPath = URL2.createObjectURL(blob);
          }
          if (!config.workerPath) {
            console.error("workerPath parameter is missing.");
          }
          worker = new Worker(config.workerPath);
          worker.postMessage(config.webAssemblyPath || "https://unpkg.com/webm-wasm@latest/dist/webm-wasm.wasm");
          worker.addEventListener("message", function(event) {
            if (event.data === "READY") {
              worker.postMessage({
                width: config.width,
                height: config.height,
                bitrate: config.bitrate || 1200,
                timebaseDen: config.frameRate || 30,
                realtime: config.realtime
              });
              cameraStream().pipeTo(new WritableStream({
                write: function(image) {
                  if (finished) {
                    console.error("Got image, but recorder is finished!");
                    return;
                  }
                  worker.postMessage(image.data.buffer, [image.data.buffer]);
                }
              }));
            } else if (!!event.data) {
              if (!isPaused) {
                arrayOfBuffers.push(event.data);
              }
            }
          });
        }
        this.record = function() {
          arrayOfBuffers = [];
          isPaused = false;
          this.blob = null;
          startRecording(stream);
          if (typeof config.initCallback === "function") {
            config.initCallback();
          }
        };
        var isPaused;
        this.pause = function() {
          isPaused = true;
        };
        this.resume = function() {
          isPaused = false;
        };
        function terminate(callback) {
          if (!worker) {
            {
              callback();
            }
            return;
          }
          worker.addEventListener("message", function(event) {
            if (event.data === null) {
              worker.terminate();
              worker = null;
              {
                callback();
              }
            }
          });
          worker.postMessage(null);
        }
        var arrayOfBuffers = [];
        this.stop = function(callback) {
          finished = true;
          var recorder = this;
          terminate(function() {
            recorder.blob = new Blob(arrayOfBuffers, {
              type: "video/webm"
            });
            callback(recorder.blob);
          });
        };
        this.name = "WebAssemblyRecorder";
        this.toString = function() {
          return this.name;
        };
        this.clearRecordedData = function() {
          arrayOfBuffers = [];
          isPaused = false;
          this.blob = null;
        };
        this.blob = null;
      }
      if (typeof RecordRTC2 !== "undefined") {
        RecordRTC2.WebAssemblyRecorder = WebAssemblyRecorder;
      }
    })(RecordRTC);
    return RecordRTC.exports;
  }
  var RecordRTCExports = requireRecordRTC();
  const definition = defineContentScript({
    matches: [CONTENT_SCRIPT_MATCHES],
    async main(ctx) {
      let screenStream = null;
      let isRecording = false;
      let isRecordingStopped = true;
      console.log("Hello from content script");
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "startRecording") {
          isRecordingStopped = false;
          startScreenRecording();
        }
      });
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "stopRecording") {
          stopScreenRecording();
        }
      });
      async function stopScreenRecording() {
        if (screenStream) {
          screenStream.getTracks().forEach((track) => {
            track.stop();
          });
          screenStream = null;
          console.log("🛑 Screen stream stopped.");
        }
        chrome.runtime.sendMessage({
          type: "recordingStopped",
          options: {
            data: "recordingStopped"
          }
        });
        await storage.setItem("local:isRecording", "false");
        isRecordingStopped = true;
      }
      async function getScreenStream() {
        if (!screenStream) {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
            selfBrowserSurface: "include"
          });
          console.log("🎥 Screen stream initialized.");
        }
        return screenStream;
      }
      async function startScreenRecording() {
        if (isRecordingStopped) return;
        console.log("starting screen recording again");
        try {
          if (isRecording) return;
          chrome.runtime.sendMessage({
            type: "recordingStarted",
            options: {
              data: "recordingStarted"
            }
          });
          await storage.setItem("local:isRecording", "true");
          console.log("🎬 Starting new 20-second recording...");
          const stream = await getScreenStream();
          const recorder2 = new RecordRTCExports.RecordRTCPromisesHandler(stream, {
            type: "video",
            mimeType: "video/webm",
            timeSlice: 2e4
          });
          isRecording = true;
          recorder2.startRecording();
          setTimeout(async () => {
            await recorder2.stopRecording();
            isRecording = false;
            const blob = await recorder2.getBlob();
            console.log(blob);
            console.log("🛑 Recording stopped, sending file...");
            if (!blob || !(blob instanceof Blob)) {
              console.error("❌ Error: Invalid Blob received.");
              return;
            }
            await sendChunksToServer(blob);
            startScreenRecording();
          }, 2e4);
        } catch (err) {
          console.error("❌ Error accessing media devices:", err);
        }
      }
      async function sendChunksToServer(chunk) {
        const formData = new FormData();
        formData.append("video_chunk", chunk, "video.webm");
        try {
          const response = await fetch("http://localhost:5000/upload-chunk", {
            method: "POST",
            body: formData
          });
          const data = await response.json();
          console.log("✅ Chunk batch uploaded:", data);
        } catch (error) {
          console.error("❌ Error uploading chunk batch:", error);
        }
      }
    }
  });
  content;
  const browser = (
    // @ts-expect-error
    ((_d = (_c = globalThis.browser) == null ? void 0 : _c.runtime) == null ? void 0 : _d.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  function print$1(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger$1 = {
    debug: (...args) => print$1(console.debug, ...args),
    log: (...args) => print$1(console.log, ...args),
    warn: (...args) => print$1(console.warn, ...args),
    error: (...args) => print$1(console.error, ...args)
  };
  const _WxtLocationChangeEvent = class _WxtLocationChangeEvent extends Event {
    constructor(newUrl, oldUrl) {
      super(_WxtLocationChangeEvent.EVENT_NAME, {});
      this.newUrl = newUrl;
      this.oldUrl = oldUrl;
    }
  };
  __publicField(_WxtLocationChangeEvent, "EVENT_NAME", getUniqueEventName("wxt:locationchange"));
  let WxtLocationChangeEvent = _WxtLocationChangeEvent;
  function getUniqueEventName(eventName) {
    var _a2;
    return `${(_a2 = browser == null ? void 0 : browser.runtime) == null ? void 0 : _a2.id}:${"content"}:${eventName}`;
  }
  function createLocationWatcher(ctx) {
    let interval;
    let oldUrl;
    return {
      /**
       * Ensure the location watcher is actively looking for URL changes. If it's already watching,
       * this is a noop.
       */
      run() {
        if (interval != null) return;
        oldUrl = new URL(location.href);
        interval = ctx.setInterval(() => {
          let newUrl = new URL(location.href);
          if (newUrl.href !== oldUrl.href) {
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
            oldUrl = newUrl;
          }
        }, 1e3);
      }
    };
  }
  const _ContentScriptContext = class _ContentScriptContext {
    constructor(contentScriptName, options) {
      __publicField(this, "isTopFrame", window.self === window.top);
      __publicField(this, "abortController");
      __publicField(this, "locationWatcher", createLocationWatcher(this));
      this.contentScriptName = contentScriptName;
      this.options = options;
      this.abortController = new AbortController();
      if (this.isTopFrame) {
        this.listenForNewerScripts({ ignoreFirstEvent: true });
        this.stopOldScripts();
      } else {
        this.listenForNewerScripts();
      }
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(reason) {
      return this.abortController.abort(reason);
    }
    get isInvalid() {
      if (browser.runtime.id == null) {
        this.notifyInvalidated();
      }
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    /**
     * Add a listener that is called when the content script's context is invalidated.
     *
     * @returns A function to remove the listener.
     *
     * @example
     * browser.runtime.onMessage.addListener(cb);
     * const removeInvalidatedListener = ctx.onInvalidated(() => {
     *   browser.runtime.onMessage.removeListener(cb);
     * })
     * // ...
     * removeInvalidatedListener();
     */
    onInvalidated(cb) {
      this.signal.addEventListener("abort", cb);
      return () => this.signal.removeEventListener("abort", cb);
    }
    /**
     * Return a promise that never resolves. Useful if you have an async function that shouldn't run
     * after the context is expired.
     *
     * @example
     * const getValueFromStorage = async () => {
     *   if (ctx.isInvalid) return ctx.block();
     *
     *   // ...
     * }
     */
    block() {
      return new Promise(() => {
      });
    }
    /**
     * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
     */
    setInterval(handler, timeout) {
      const id = setInterval(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearInterval(id));
      return id;
    }
    /**
     * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
     */
    setTimeout(handler, timeout) {
      const id = setTimeout(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearTimeout(id));
      return id;
    }
    /**
     * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
     * invalidated.
     */
    requestAnimationFrame(callback) {
      const id = requestAnimationFrame((...args) => {
        if (this.isValid) callback(...args);
      });
      this.onInvalidated(() => cancelAnimationFrame(id));
      return id;
    }
    /**
     * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
     * invalidated.
     */
    requestIdleCallback(callback, options) {
      const id = requestIdleCallback((...args) => {
        if (!this.signal.aborted) callback(...args);
      }, options);
      this.onInvalidated(() => cancelIdleCallback(id));
      return id;
    }
    addEventListener(target, type, handler, options) {
      var _a2;
      if (type === "wxt:locationchange") {
        if (this.isValid) this.locationWatcher.run();
      }
      (_a2 = target.addEventListener) == null ? void 0 : _a2.call(
        target,
        type.startsWith("wxt:") ? getUniqueEventName(type) : type,
        handler,
        {
          ...options,
          signal: this.signal
        }
      );
    }
    /**
     * @internal
     * Abort the abort controller and execute all `onInvalidated` listeners.
     */
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      logger$1.debug(
        `Content script "${this.contentScriptName}" context invalidated`
      );
    }
    stopOldScripts() {
      window.postMessage(
        {
          type: _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
          contentScriptName: this.contentScriptName
        },
        "*"
      );
    }
    listenForNewerScripts(options) {
      let isFirst = true;
      const cb = (event) => {
        var _a2, _b2;
        if (((_a2 = event.data) == null ? void 0 : _a2.type) === _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE && ((_b2 = event.data) == null ? void 0 : _b2.contentScriptName) === this.contentScriptName) {
          const wasFirst = isFirst;
          isFirst = false;
          if (wasFirst && (options == null ? void 0 : options.ignoreFirstEvent)) return;
          this.notifyInvalidated();
        }
      };
      addEventListener("message", cb);
      this.onInvalidated(() => removeEventListener("message", cb));
    }
  };
  __publicField(_ContentScriptContext, "SCRIPT_STARTED_MESSAGE_TYPE", getUniqueEventName(
    "wxt:content-script-started"
  ));
  let ContentScriptContext = _ContentScriptContext;
  const nullKey = Symbol("null");
  let keyCounter = 0;
  class ManyKeysMap extends Map {
    constructor() {
      super();
      this._objectHashes = /* @__PURE__ */ new WeakMap();
      this._symbolHashes = /* @__PURE__ */ new Map();
      this._publicKeys = /* @__PURE__ */ new Map();
      const [pairs] = arguments;
      if (pairs === null || pairs === void 0) {
        return;
      }
      if (typeof pairs[Symbol.iterator] !== "function") {
        throw new TypeError(typeof pairs + " is not iterable (cannot read property Symbol(Symbol.iterator))");
      }
      for (const [keys, value] of pairs) {
        this.set(keys, value);
      }
    }
    _getPublicKeys(keys, create = false) {
      if (!Array.isArray(keys)) {
        throw new TypeError("The keys parameter must be an array");
      }
      const privateKey = this._getPrivateKey(keys, create);
      let publicKey;
      if (privateKey && this._publicKeys.has(privateKey)) {
        publicKey = this._publicKeys.get(privateKey);
      } else if (create) {
        publicKey = [...keys];
        this._publicKeys.set(privateKey, publicKey);
      }
      return { privateKey, publicKey };
    }
    _getPrivateKey(keys, create = false) {
      const privateKeys = [];
      for (let key of keys) {
        if (key === null) {
          key = nullKey;
        }
        const hashes = typeof key === "object" || typeof key === "function" ? "_objectHashes" : typeof key === "symbol" ? "_symbolHashes" : false;
        if (!hashes) {
          privateKeys.push(key);
        } else if (this[hashes].has(key)) {
          privateKeys.push(this[hashes].get(key));
        } else if (create) {
          const privateKey = `@@mkm-ref-${keyCounter++}@@`;
          this[hashes].set(key, privateKey);
          privateKeys.push(privateKey);
        } else {
          return false;
        }
      }
      return JSON.stringify(privateKeys);
    }
    set(keys, value) {
      const { publicKey } = this._getPublicKeys(keys, true);
      return super.set(publicKey, value);
    }
    get(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.get(publicKey);
    }
    has(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.has(publicKey);
    }
    delete(keys) {
      const { publicKey, privateKey } = this._getPublicKeys(keys);
      return Boolean(publicKey && super.delete(publicKey) && this._publicKeys.delete(privateKey));
    }
    clear() {
      super.clear();
      this._symbolHashes.clear();
      this._publicKeys.clear();
    }
    get [Symbol.toStringTag]() {
      return "ManyKeysMap";
    }
    get size() {
      return super.size;
    }
  }
  new ManyKeysMap();
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  const result = (async () => {
    try {
      initPlugins();
      const { main, ...options } = definition;
      const ctx = new ContentScriptContext("content", options);
      return await main(ctx);
    } catch (err) {
      logger.error(
        `The content script "${"content"}" crashed on startup!`,
        err
      );
      throw err;
    }
  })();
  return result;
}();
content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvZGVmaW5lLWNvbnRlbnQtc2NyaXB0Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kZXF1YWwvbGl0ZS9pbmRleC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvYXN5bmMtbXV0ZXgvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L3N0b3JhZ2UvZGlzdC9pbmRleC5tanMiLCIuLi8uLi8uLi91dGlscy9NYXRjaGVzLnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3JlY29yZHJ0Yy9SZWNvcmRSVEMuanMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50LnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIvY2hyb21lLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9zYW5kYm94L3V0aWxzL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvY2xpZW50L2NvbnRlbnQtc2NyaXB0cy9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9jbGllbnQvY29udGVudC1zY3JpcHRzL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2NsaWVudC9jb250ZW50LXNjcmlwdHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbWFueS1rZXlzLW1hcC9pbmRleC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AMW5hdHN1L3dhaXQtZWxlbWVudC9kaXN0L2luZGV4Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZGVmaW5lQ29udGVudFNjcmlwdChkZWZpbml0aW9uKSB7XG4gIHJldHVybiBkZWZpbml0aW9uO1xufVxuIiwidmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXF1YWwoZm9vLCBiYXIpIHtcblx0dmFyIGN0b3IsIGxlbjtcblx0aWYgKGZvbyA9PT0gYmFyKSByZXR1cm4gdHJ1ZTtcblxuXHRpZiAoZm9vICYmIGJhciAmJiAoY3Rvcj1mb28uY29uc3RydWN0b3IpID09PSBiYXIuY29uc3RydWN0b3IpIHtcblx0XHRpZiAoY3RvciA9PT0gRGF0ZSkgcmV0dXJuIGZvby5nZXRUaW1lKCkgPT09IGJhci5nZXRUaW1lKCk7XG5cdFx0aWYgKGN0b3IgPT09IFJlZ0V4cCkgcmV0dXJuIGZvby50b1N0cmluZygpID09PSBiYXIudG9TdHJpbmcoKTtcblxuXHRcdGlmIChjdG9yID09PSBBcnJheSkge1xuXHRcdFx0aWYgKChsZW49Zm9vLmxlbmd0aCkgPT09IGJhci5sZW5ndGgpIHtcblx0XHRcdFx0d2hpbGUgKGxlbi0tICYmIGRlcXVhbChmb29bbGVuXSwgYmFyW2xlbl0pKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBsZW4gPT09IC0xO1xuXHRcdH1cblxuXHRcdGlmICghY3RvciB8fCB0eXBlb2YgZm9vID09PSAnb2JqZWN0Jykge1xuXHRcdFx0bGVuID0gMDtcblx0XHRcdGZvciAoY3RvciBpbiBmb28pIHtcblx0XHRcdFx0aWYgKGhhcy5jYWxsKGZvbywgY3RvcikgJiYgKytsZW4gJiYgIWhhcy5jYWxsKGJhciwgY3RvcikpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKCEoY3RvciBpbiBiYXIpIHx8ICFkZXF1YWwoZm9vW2N0b3JdLCBiYXJbY3Rvcl0pKSByZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gT2JqZWN0LmtleXMoYmFyKS5sZW5ndGggPT09IGxlbjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZm9vICE9PSBmb28gJiYgYmFyICE9PSBiYXI7XG59XG4iLCJjb25zdCBFX1RJTUVPVVQgPSBuZXcgRXJyb3IoJ3RpbWVvdXQgd2hpbGUgd2FpdGluZyBmb3IgbXV0ZXggdG8gYmVjb21lIGF2YWlsYWJsZScpO1xuY29uc3QgRV9BTFJFQURZX0xPQ0tFRCA9IG5ldyBFcnJvcignbXV0ZXggYWxyZWFkeSBsb2NrZWQnKTtcbmNvbnN0IEVfQ0FOQ0VMRUQgPSBuZXcgRXJyb3IoJ3JlcXVlc3QgZm9yIGxvY2sgY2FuY2VsZWQnKTtcblxudmFyIF9fYXdhaXRlciQyID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jbGFzcyBTZW1hcGhvcmUge1xuICAgIGNvbnN0cnVjdG9yKF92YWx1ZSwgX2NhbmNlbEVycm9yID0gRV9DQU5DRUxFRCkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IF92YWx1ZTtcbiAgICAgICAgdGhpcy5fY2FuY2VsRXJyb3IgPSBfY2FuY2VsRXJyb3I7XG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVycyA9IFtdO1xuICAgIH1cbiAgICBhY3F1aXJlKHdlaWdodCA9IDEsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICBpZiAod2VpZ2h0IDw9IDApXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgd2VpZ2h0ICR7d2VpZ2h0fTogbXVzdCBiZSBwb3NpdGl2ZWApO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFzayA9IHsgcmVzb2x2ZSwgcmVqZWN0LCB3ZWlnaHQsIHByaW9yaXR5IH07XG4gICAgICAgICAgICBjb25zdCBpID0gZmluZEluZGV4RnJvbUVuZCh0aGlzLl9xdWV1ZSwgKG90aGVyKSA9PiBwcmlvcml0eSA8PSBvdGhlci5wcmlvcml0eSk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEgJiYgd2VpZ2h0IDw9IHRoaXMuX3ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8gTmVlZHMgaW1tZWRpYXRlIGRpc3BhdGNoLCBza2lwIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoSXRlbSh0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNwbGljZShpICsgMSwgMCwgdGFzayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBydW5FeGNsdXNpdmUoY2FsbGJhY2tfMSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyJDIodGhpcywgYXJndW1lbnRzLCB2b2lkIDAsIGZ1bmN0aW9uKiAoY2FsbGJhY2ssIHdlaWdodCA9IDEsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICAgICAgY29uc3QgW3ZhbHVlLCByZWxlYXNlXSA9IHlpZWxkIHRoaXMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHJlbGVhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHdhaXRGb3JVbmxvY2sod2VpZ2h0ID0gMSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPD0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgIGlmICh0aGlzLl9jb3VsZExvY2tJbW1lZGlhdGVseSh3ZWlnaHQsIHByaW9yaXR5KSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV0pXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSA9IFtdO1xuICAgICAgICAgICAgICAgIGluc2VydFNvcnRlZCh0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV0sIHsgcmVzb2x2ZSwgcHJpb3JpdHkgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc0xvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlIDw9IDA7XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoUXVldWUoKTtcbiAgICB9XG4gICAgcmVsZWFzZSh3ZWlnaHQgPSAxKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPD0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlICs9IHdlaWdodDtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hRdWV1ZSgpO1xuICAgIH1cbiAgICBjYW5jZWwoKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlLmZvckVhY2goKGVudHJ5KSA9PiBlbnRyeS5yZWplY3QodGhpcy5fY2FuY2VsRXJyb3IpKTtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICB9XG4gICAgX2Rpc3BhdGNoUXVldWUoKSB7XG4gICAgICAgIHRoaXMuX2RyYWluVW5sb2NrV2FpdGVycygpO1xuICAgICAgICB3aGlsZSAodGhpcy5fcXVldWUubGVuZ3RoID4gMCAmJiB0aGlzLl9xdWV1ZVswXS53ZWlnaHQgPD0gdGhpcy5fdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoSXRlbSh0aGlzLl9xdWV1ZS5zaGlmdCgpKTtcbiAgICAgICAgICAgIHRoaXMuX2RyYWluVW5sb2NrV2FpdGVycygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9kaXNwYXRjaEl0ZW0oaXRlbSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gdGhpcy5fdmFsdWU7XG4gICAgICAgIHRoaXMuX3ZhbHVlIC09IGl0ZW0ud2VpZ2h0O1xuICAgICAgICBpdGVtLnJlc29sdmUoW3ByZXZpb3VzVmFsdWUsIHRoaXMuX25ld1JlbGVhc2VyKGl0ZW0ud2VpZ2h0KV0pO1xuICAgIH1cbiAgICBfbmV3UmVsZWFzZXIod2VpZ2h0KSB7XG4gICAgICAgIGxldCBjYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGlmIChjYWxsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVsZWFzZSh3ZWlnaHQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBfZHJhaW5VbmxvY2tXYWl0ZXJzKCkge1xuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB3ZWlnaHQgPSB0aGlzLl92YWx1ZTsgd2VpZ2h0ID4gMDsgd2VpZ2h0LS0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YWl0ZXJzID0gdGhpcy5fd2VpZ2h0ZWRXYWl0ZXJzW3dlaWdodCAtIDFdO1xuICAgICAgICAgICAgICAgIGlmICghd2FpdGVycylcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgd2FpdGVycy5mb3JFYWNoKCh3YWl0ZXIpID0+IHdhaXRlci5yZXNvbHZlKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcXVldWVkUHJpb3JpdHkgPSB0aGlzLl9xdWV1ZVswXS5wcmlvcml0eTtcbiAgICAgICAgICAgIGZvciAobGV0IHdlaWdodCA9IHRoaXMuX3ZhbHVlOyB3ZWlnaHQgPiAwOyB3ZWlnaHQtLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhaXRlcnMgPSB0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKCF3YWl0ZXJzKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBpID0gd2FpdGVycy5maW5kSW5kZXgoKHdhaXRlcikgPT4gd2FpdGVyLnByaW9yaXR5IDw9IHF1ZXVlZFByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICAoaSA9PT0gLTEgPyB3YWl0ZXJzIDogd2FpdGVycy5zcGxpY2UoMCwgaSkpXG4gICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKCh3YWl0ZXIgPT4gd2FpdGVyLnJlc29sdmUoKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9jb3VsZExvY2tJbW1lZGlhdGVseSh3ZWlnaHQsIHByaW9yaXR5KSB7XG4gICAgICAgIHJldHVybiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwIHx8IHRoaXMuX3F1ZXVlWzBdLnByaW9yaXR5IDwgcHJpb3JpdHkpICYmXG4gICAgICAgICAgICB3ZWlnaHQgPD0gdGhpcy5fdmFsdWU7XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zZXJ0U29ydGVkKGEsIHYpIHtcbiAgICBjb25zdCBpID0gZmluZEluZGV4RnJvbUVuZChhLCAob3RoZXIpID0+IHYucHJpb3JpdHkgPD0gb3RoZXIucHJpb3JpdHkpO1xuICAgIGEuc3BsaWNlKGkgKyAxLCAwLCB2KTtcbn1cbmZ1bmN0aW9uIGZpbmRJbmRleEZyb21FbmQoYSwgcHJlZGljYXRlKSB7XG4gICAgZm9yIChsZXQgaSA9IGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShhW2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG52YXIgX19hd2FpdGVyJDEgPSAodW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNsYXNzIE11dGV4IHtcbiAgICBjb25zdHJ1Y3RvcihjYW5jZWxFcnJvcikge1xuICAgICAgICB0aGlzLl9zZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKDEsIGNhbmNlbEVycm9yKTtcbiAgICB9XG4gICAgYWNxdWlyZSgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlciQxKHRoaXMsIGFyZ3VtZW50cywgdm9pZCAwLCBmdW5jdGlvbiogKHByaW9yaXR5ID0gMCkge1xuICAgICAgICAgICAgY29uc3QgWywgcmVsZWFzZXJdID0geWllbGQgdGhpcy5fc2VtYXBob3JlLmFjcXVpcmUoMSwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlbGVhc2VyO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcnVuRXhjbHVzaXZlKGNhbGxiYWNrLCBwcmlvcml0eSA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbWFwaG9yZS5ydW5FeGNsdXNpdmUoKCkgPT4gY2FsbGJhY2soKSwgMSwgcHJpb3JpdHkpO1xuICAgIH1cbiAgICBpc0xvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbWFwaG9yZS5pc0xvY2tlZCgpO1xuICAgIH1cbiAgICB3YWl0Rm9yVW5sb2NrKHByaW9yaXR5ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VtYXBob3JlLndhaXRGb3JVbmxvY2soMSwgcHJpb3JpdHkpO1xuICAgIH1cbiAgICByZWxlYXNlKCkge1xuICAgICAgICBpZiAodGhpcy5fc2VtYXBob3JlLmlzTG9ja2VkKCkpXG4gICAgICAgICAgICB0aGlzLl9zZW1hcGhvcmUucmVsZWFzZSgpO1xuICAgIH1cbiAgICBjYW5jZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZW1hcGhvcmUuY2FuY2VsKCk7XG4gICAgfVxufVxuXG52YXIgX19hd2FpdGVyID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5mdW5jdGlvbiB3aXRoVGltZW91dChzeW5jLCB0aW1lb3V0LCB0aW1lb3V0RXJyb3IgPSBFX1RJTUVPVVQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBhY3F1aXJlOiAod2VpZ2h0T3JQcmlvcml0eSwgcHJpb3JpdHkpID0+IHtcbiAgICAgICAgICAgIGxldCB3ZWlnaHQ7XG4gICAgICAgICAgICBpZiAoaXNTZW1hcGhvcmUoc3luYykpIHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQgPSB3ZWlnaHRPclByaW9yaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2VpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHByaW9yaXR5ID0gd2VpZ2h0T3JQcmlvcml0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3ZWlnaHQgIT09IHVuZGVmaW5lZCAmJiB3ZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGxldCBpc1RpbWVvdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaXNUaW1lb3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHRpbWVvdXRFcnJvcik7XG4gICAgICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGlja2V0ID0geWllbGQgKGlzU2VtYXBob3JlKHN5bmMpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHN5bmMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBzeW5jLmFjcXVpcmUocHJpb3JpdHkpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsZWFzZSA9IEFycmF5LmlzQXJyYXkodGlja2V0KSA/IHRpY2tldFsxXSA6IHRpY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGVhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aWNrZXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgcnVuRXhjbHVzaXZlKGNhbGxiYWNrLCB3ZWlnaHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGxldCByZWxlYXNlID0gKCkgPT4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpY2tldCA9IHlpZWxkIHRoaXMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGlja2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZSA9IHRpY2tldFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCBjYWxsYmFjayh0aWNrZXRbMF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZSA9IHRpY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICByZWxlYXNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbGVhc2Uod2VpZ2h0KSB7XG4gICAgICAgICAgICBzeW5jLnJlbGVhc2Uod2VpZ2h0KTtcbiAgICAgICAgfSxcbiAgICAgICAgY2FuY2VsKCkge1xuICAgICAgICAgICAgcmV0dXJuIHN5bmMuY2FuY2VsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHdhaXRGb3JVbmxvY2s6ICh3ZWlnaHRPclByaW9yaXR5LCBwcmlvcml0eSkgPT4ge1xuICAgICAgICAgICAgbGV0IHdlaWdodDtcbiAgICAgICAgICAgIGlmIChpc1NlbWFwaG9yZShzeW5jKSkge1xuICAgICAgICAgICAgICAgIHdlaWdodCA9IHdlaWdodE9yUHJpb3JpdHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcHJpb3JpdHkgPSB3ZWlnaHRPclByaW9yaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdlaWdodCAhPT0gdW5kZWZpbmVkICYmIHdlaWdodCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHdlaWdodCAke3dlaWdodH06IG11c3QgYmUgcG9zaXRpdmVgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QodGltZW91dEVycm9yKSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgKGlzU2VtYXBob3JlKHN5bmMpXG4gICAgICAgICAgICAgICAgICAgID8gc3luYy53YWl0Rm9yVW5sb2NrKHdlaWdodCwgcHJpb3JpdHkpXG4gICAgICAgICAgICAgICAgICAgIDogc3luYy53YWl0Rm9yVW5sb2NrKHByaW9yaXR5KSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNMb2NrZWQ6ICgpID0+IHN5bmMuaXNMb2NrZWQoKSxcbiAgICAgICAgZ2V0VmFsdWU6ICgpID0+IHN5bmMuZ2V0VmFsdWUoKSxcbiAgICAgICAgc2V0VmFsdWU6ICh2YWx1ZSkgPT4gc3luYy5zZXRWYWx1ZSh2YWx1ZSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGlzU2VtYXBob3JlKHN5bmMpIHtcbiAgICByZXR1cm4gc3luYy5nZXRWYWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpc25lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXNcbmZ1bmN0aW9uIHRyeUFjcXVpcmUoc3luYywgYWxyZWFkeUFjcXVpcmVkRXJyb3IgPSBFX0FMUkVBRFlfTE9DS0VEKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gd2l0aFRpbWVvdXQoc3luYywgMCwgYWxyZWFkeUFjcXVpcmVkRXJyb3IpO1xufVxuXG5leHBvcnQgeyBFX0FMUkVBRFlfTE9DS0VELCBFX0NBTkNFTEVELCBFX1RJTUVPVVQsIE11dGV4LCBTZW1hcGhvcmUsIHRyeUFjcXVpcmUsIHdpdGhUaW1lb3V0IH07XG4iLCJpbXBvcnQgeyBkZXF1YWwgfSBmcm9tICdkZXF1YWwvbGl0ZSc7XG5pbXBvcnQgeyBNdXRleCB9IGZyb20gJ2FzeW5jLW11dGV4JztcblxuY29uc3QgYnJvd3NlciA9IChcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkID09IG51bGwgPyBnbG9iYWxUaGlzLmNocm9tZSA6IChcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgZ2xvYmFsVGhpcy5icm93c2VyXG4gIClcbik7XG5jb25zdCBzdG9yYWdlID0gY3JlYXRlU3RvcmFnZSgpO1xuZnVuY3Rpb24gY3JlYXRlU3RvcmFnZSgpIHtcbiAgY29uc3QgZHJpdmVycyA9IHtcbiAgICBsb2NhbDogY3JlYXRlRHJpdmVyKFwibG9jYWxcIiksXG4gICAgc2Vzc2lvbjogY3JlYXRlRHJpdmVyKFwic2Vzc2lvblwiKSxcbiAgICBzeW5jOiBjcmVhdGVEcml2ZXIoXCJzeW5jXCIpLFxuICAgIG1hbmFnZWQ6IGNyZWF0ZURyaXZlcihcIm1hbmFnZWRcIilcbiAgfTtcbiAgY29uc3QgZ2V0RHJpdmVyID0gKGFyZWEpID0+IHtcbiAgICBjb25zdCBkcml2ZXIgPSBkcml2ZXJzW2FyZWFdO1xuICAgIGlmIChkcml2ZXIgPT0gbnVsbCkge1xuICAgICAgY29uc3QgYXJlYU5hbWVzID0gT2JqZWN0LmtleXMoZHJpdmVycykuam9pbihcIiwgXCIpO1xuICAgICAgdGhyb3cgRXJyb3IoYEludmFsaWQgYXJlYSBcIiR7YXJlYX1cIi4gT3B0aW9uczogJHthcmVhTmFtZXN9YCk7XG4gICAgfVxuICAgIHJldHVybiBkcml2ZXI7XG4gIH07XG4gIGNvbnN0IHJlc29sdmVLZXkgPSAoa2V5KSA9PiB7XG4gICAgY29uc3QgZGVsaW1pbmF0b3JJbmRleCA9IGtleS5pbmRleE9mKFwiOlwiKTtcbiAgICBjb25zdCBkcml2ZXJBcmVhID0ga2V5LnN1YnN0cmluZygwLCBkZWxpbWluYXRvckluZGV4KTtcbiAgICBjb25zdCBkcml2ZXJLZXkgPSBrZXkuc3Vic3RyaW5nKGRlbGltaW5hdG9ySW5kZXggKyAxKTtcbiAgICBpZiAoZHJpdmVyS2V5ID09IG51bGwpXG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgYFN0b3JhZ2Uga2V5IHNob3VsZCBiZSBpbiB0aGUgZm9ybSBvZiBcImFyZWE6a2V5XCIsIGJ1dCByZWNlaXZlZCBcIiR7a2V5fVwiYFxuICAgICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgZHJpdmVyQXJlYSxcbiAgICAgIGRyaXZlcktleSxcbiAgICAgIGRyaXZlcjogZ2V0RHJpdmVyKGRyaXZlckFyZWEpXG4gICAgfTtcbiAgfTtcbiAgY29uc3QgZ2V0TWV0YUtleSA9IChrZXkpID0+IGtleSArIFwiJFwiO1xuICBjb25zdCBtZXJnZU1ldGEgPSAob2xkTWV0YSwgbmV3TWV0YSkgPT4ge1xuICAgIGNvbnN0IG5ld0ZpZWxkcyA9IHsgLi4ub2xkTWV0YSB9O1xuICAgIE9iamVjdC5lbnRyaWVzKG5ld01ldGEpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRlbGV0ZSBuZXdGaWVsZHNba2V5XTtcbiAgICAgIGVsc2VcbiAgICAgICAgbmV3RmllbGRzW2tleV0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3RmllbGRzO1xuICB9O1xuICBjb25zdCBnZXRWYWx1ZU9yRmFsbGJhY2sgPSAodmFsdWUsIGZhbGxiYWNrKSA9PiB2YWx1ZSA/PyBmYWxsYmFjayA/PyBudWxsO1xuICBjb25zdCBnZXRNZXRhVmFsdWUgPSAocHJvcGVydGllcykgPT4gdHlwZW9mIHByb3BlcnRpZXMgPT09IFwib2JqZWN0XCIgJiYgIUFycmF5LmlzQXJyYXkocHJvcGVydGllcykgPyBwcm9wZXJ0aWVzIDoge307XG4gIGNvbnN0IGdldEl0ZW0gPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXksIG9wdHMpID0+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBkcml2ZXIuZ2V0SXRlbShkcml2ZXJLZXkpO1xuICAgIHJldHVybiBnZXRWYWx1ZU9yRmFsbGJhY2socmVzLCBvcHRzPy5mYWxsYmFjayA/PyBvcHRzPy5kZWZhdWx0VmFsdWUpO1xuICB9O1xuICBjb25zdCBnZXRNZXRhID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5KSA9PiB7XG4gICAgY29uc3QgbWV0YUtleSA9IGdldE1ldGFLZXkoZHJpdmVyS2V5KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBkcml2ZXIuZ2V0SXRlbShtZXRhS2V5KTtcbiAgICByZXR1cm4gZ2V0TWV0YVZhbHVlKHJlcyk7XG4gIH07XG4gIGNvbnN0IHNldEl0ZW0gPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXksIHZhbHVlKSA9PiB7XG4gICAgYXdhaXQgZHJpdmVyLnNldEl0ZW0oZHJpdmVyS2V5LCB2YWx1ZSA/PyBudWxsKTtcbiAgfTtcbiAgY29uc3Qgc2V0TWV0YSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcykgPT4ge1xuICAgIGNvbnN0IG1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG4gICAgY29uc3QgZXhpc3RpbmdGaWVsZHMgPSBnZXRNZXRhVmFsdWUoYXdhaXQgZHJpdmVyLmdldEl0ZW0obWV0YUtleSkpO1xuICAgIGF3YWl0IGRyaXZlci5zZXRJdGVtKG1ldGFLZXksIG1lcmdlTWV0YShleGlzdGluZ0ZpZWxkcywgcHJvcGVydGllcykpO1xuICB9O1xuICBjb25zdCByZW1vdmVJdGVtID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKSA9PiB7XG4gICAgYXdhaXQgZHJpdmVyLnJlbW92ZUl0ZW0oZHJpdmVyS2V5KTtcbiAgICBpZiAob3B0cz8ucmVtb3ZlTWV0YSkge1xuICAgICAgY29uc3QgbWV0YUtleSA9IGdldE1ldGFLZXkoZHJpdmVyS2V5KTtcbiAgICAgIGF3YWl0IGRyaXZlci5yZW1vdmVJdGVtKG1ldGFLZXkpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgcmVtb3ZlTWV0YSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcykgPT4ge1xuICAgIGNvbnN0IG1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG4gICAgaWYgKHByb3BlcnRpZXMgPT0gbnVsbCkge1xuICAgICAgYXdhaXQgZHJpdmVyLnJlbW92ZUl0ZW0obWV0YUtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG5ld0ZpZWxkcyA9IGdldE1ldGFWYWx1ZShhd2FpdCBkcml2ZXIuZ2V0SXRlbShtZXRhS2V5KSk7XG4gICAgICBbcHJvcGVydGllc10uZmxhdCgpLmZvckVhY2goKGZpZWxkKSA9PiBkZWxldGUgbmV3RmllbGRzW2ZpZWxkXSk7XG4gICAgICBhd2FpdCBkcml2ZXIuc2V0SXRlbShtZXRhS2V5LCBuZXdGaWVsZHMpO1xuICAgIH1cbiAgfTtcbiAgY29uc3Qgd2F0Y2ggPSAoZHJpdmVyLCBkcml2ZXJLZXksIGNiKSA9PiB7XG4gICAgcmV0dXJuIGRyaXZlci53YXRjaChkcml2ZXJLZXksIGNiKTtcbiAgfTtcbiAgY29uc3Qgc3RvcmFnZTIgPSB7XG4gICAgZ2V0SXRlbTogYXN5bmMgKGtleSwgb3B0cykgPT4ge1xuICAgICAgY29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuICAgICAgcmV0dXJuIGF3YWl0IGdldEl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIG9wdHMpO1xuICAgIH0sXG4gICAgZ2V0SXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG4gICAgICBjb25zdCBhcmVhVG9LZXlNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICAgICAgY29uc3Qga2V5VG9PcHRzTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcbiAgICAgIGNvbnN0IG9yZGVyZWRLZXlzID0gW107XG4gICAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBsZXQga2V5U3RyO1xuICAgICAgICBsZXQgb3B0cztcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBrZXlTdHIgPSBrZXk7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJnZXRWYWx1ZVwiIGluIGtleSkge1xuICAgICAgICAgIGtleVN0ciA9IGtleS5rZXk7XG4gICAgICAgICAgb3B0cyA9IHsgZmFsbGJhY2s6IGtleS5mYWxsYmFjayB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGtleVN0ciA9IGtleS5rZXk7XG4gICAgICAgICAgb3B0cyA9IGtleS5vcHRpb25zO1xuICAgICAgICB9XG4gICAgICAgIG9yZGVyZWRLZXlzLnB1c2goa2V5U3RyKTtcbiAgICAgICAgY29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5U3RyKTtcbiAgICAgICAgY29uc3QgYXJlYUtleXMgPSBhcmVhVG9LZXlNYXAuZ2V0KGRyaXZlckFyZWEpID8/IFtdO1xuICAgICAgICBhcmVhVG9LZXlNYXAuc2V0KGRyaXZlckFyZWEsIGFyZWFLZXlzLmNvbmNhdChkcml2ZXJLZXkpKTtcbiAgICAgICAga2V5VG9PcHRzTWFwLnNldChrZXlTdHIsIG9wdHMpO1xuICAgICAgfSk7XG4gICAgICBjb25zdCByZXN1bHRzTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICBBcnJheS5mcm9tKGFyZWFUb0tleU1hcC5lbnRyaWVzKCkpLm1hcChhc3luYyAoW2RyaXZlckFyZWEsIGtleXMyXSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRyaXZlclJlc3VsdHMgPSBhd2FpdCBkcml2ZXJzW2RyaXZlckFyZWFdLmdldEl0ZW1zKGtleXMyKTtcbiAgICAgICAgICBkcml2ZXJSZXN1bHRzLmZvckVhY2goKGRyaXZlclJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gYCR7ZHJpdmVyQXJlYX06JHtkcml2ZXJSZXN1bHQua2V5fWA7XG4gICAgICAgICAgICBjb25zdCBvcHRzID0ga2V5VG9PcHRzTWFwLmdldChrZXkpO1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZU9yRmFsbGJhY2soXG4gICAgICAgICAgICAgIGRyaXZlclJlc3VsdC52YWx1ZSxcbiAgICAgICAgICAgICAgb3B0cz8uZmFsbGJhY2sgPz8gb3B0cz8uZGVmYXVsdFZhbHVlXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmVzdWx0c01hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgcmV0dXJuIG9yZGVyZWRLZXlzLm1hcCgoa2V5KSA9PiAoe1xuICAgICAgICBrZXksXG4gICAgICAgIHZhbHVlOiByZXN1bHRzTWFwLmdldChrZXkpXG4gICAgICB9KSk7XG4gICAgfSxcbiAgICBnZXRNZXRhOiBhc3luYyAoa2V5KSA9PiB7XG4gICAgICBjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG4gICAgICByZXR1cm4gYXdhaXQgZ2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSk7XG4gICAgfSxcbiAgICBnZXRNZXRhczogYXN5bmMgKGFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IGtleXMgPSBhcmdzLm1hcCgoYXJnKSA9PiB7XG4gICAgICAgIGNvbnN0IGtleSA9IHR5cGVvZiBhcmcgPT09IFwic3RyaW5nXCIgPyBhcmcgOiBhcmcua2V5O1xuICAgICAgICBjb25zdCB7IGRyaXZlckFyZWEsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGtleSxcbiAgICAgICAgICBkcml2ZXJBcmVhLFxuICAgICAgICAgIGRyaXZlcktleSxcbiAgICAgICAgICBkcml2ZXJNZXRhS2V5OiBnZXRNZXRhS2V5KGRyaXZlcktleSlcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgY29uc3QgYXJlYVRvRHJpdmVyTWV0YUtleXNNYXAgPSBrZXlzLnJlZHVjZSgobWFwLCBrZXkpID0+IHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBtYXBbX2EgPSBrZXkuZHJpdmVyQXJlYV0gPz8gKG1hcFtfYV0gPSBbXSk7XG4gICAgICAgIG1hcFtrZXkuZHJpdmVyQXJlYV0ucHVzaChrZXkpO1xuICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgfSwge30pO1xuICAgICAgY29uc3QgcmVzdWx0c01hcCA9IHt9O1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGFyZWFUb0RyaXZlck1ldGFLZXlzTWFwKS5tYXAoYXN5bmMgKFthcmVhLCBrZXlzMl0pID0+IHtcbiAgICAgICAgICBjb25zdCBhcmVhUmVzID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlW2FyZWFdLmdldChcbiAgICAgICAgICAgIGtleXMyLm1hcCgoa2V5KSA9PiBrZXkuZHJpdmVyTWV0YUtleSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGtleXMyLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0c01hcFtrZXkua2V5XSA9IGFyZWFSZXNba2V5LmRyaXZlck1ldGFLZXldID8/IHt9O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIHJldHVybiBrZXlzLm1hcCgoa2V5KSA9PiAoe1xuICAgICAgICBrZXk6IGtleS5rZXksXG4gICAgICAgIG1ldGE6IHJlc3VsdHNNYXBba2V5LmtleV1cbiAgICAgIH0pKTtcbiAgICB9LFxuICAgIHNldEl0ZW06IGFzeW5jIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICBjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG4gICAgICBhd2FpdCBzZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCB2YWx1ZSk7XG4gICAgfSxcbiAgICBzZXRJdGVtczogYXN5bmMgKGl0ZW1zKSA9PiB7XG4gICAgICBjb25zdCBhcmVhVG9LZXlWYWx1ZU1hcCA9IHt9O1xuICAgICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBjb25zdCB7IGRyaXZlckFyZWEsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShcbiAgICAgICAgICBcImtleVwiIGluIGl0ZW0gPyBpdGVtLmtleSA6IGl0ZW0uaXRlbS5rZXlcbiAgICAgICAgKTtcbiAgICAgICAgYXJlYVRvS2V5VmFsdWVNYXBbZHJpdmVyQXJlYV0gPz8gKGFyZWFUb0tleVZhbHVlTWFwW2RyaXZlckFyZWFdID0gW10pO1xuICAgICAgICBhcmVhVG9LZXlWYWx1ZU1hcFtkcml2ZXJBcmVhXS5wdXNoKHtcbiAgICAgICAgICBrZXk6IGRyaXZlcktleSxcbiAgICAgICAgICB2YWx1ZTogaXRlbS52YWx1ZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGFyZWFUb0tleVZhbHVlTWFwKS5tYXAoYXN5bmMgKFtkcml2ZXJBcmVhLCB2YWx1ZXNdKSA9PiB7XG4gICAgICAgICAgY29uc3QgZHJpdmVyID0gZ2V0RHJpdmVyKGRyaXZlckFyZWEpO1xuICAgICAgICAgIGF3YWl0IGRyaXZlci5zZXRJdGVtcyh2YWx1ZXMpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9LFxuICAgIHNldE1ldGE6IGFzeW5jIChrZXksIHByb3BlcnRpZXMpID0+IHtcbiAgICAgIGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcbiAgICAgIGF3YWl0IHNldE1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpO1xuICAgIH0sXG4gICAgc2V0TWV0YXM6IGFzeW5jIChpdGVtcykgPT4ge1xuICAgICAgY29uc3QgYXJlYVRvTWV0YVVwZGF0ZXNNYXAgPSB7fTtcbiAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgY29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoXG4gICAgICAgICAgXCJrZXlcIiBpbiBpdGVtID8gaXRlbS5rZXkgOiBpdGVtLml0ZW0ua2V5XG4gICAgICAgICk7XG4gICAgICAgIGFyZWFUb01ldGFVcGRhdGVzTWFwW2RyaXZlckFyZWFdID8/IChhcmVhVG9NZXRhVXBkYXRlc01hcFtkcml2ZXJBcmVhXSA9IFtdKTtcbiAgICAgICAgYXJlYVRvTWV0YVVwZGF0ZXNNYXBbZHJpdmVyQXJlYV0ucHVzaCh7XG4gICAgICAgICAga2V5OiBkcml2ZXJLZXksXG4gICAgICAgICAgcHJvcGVydGllczogaXRlbS5tZXRhXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoYXJlYVRvTWV0YVVwZGF0ZXNNYXApLm1hcChcbiAgICAgICAgICBhc3luYyAoW3N0b3JhZ2VBcmVhLCB1cGRhdGVzXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZHJpdmVyID0gZ2V0RHJpdmVyKHN0b3JhZ2VBcmVhKTtcbiAgICAgICAgICAgIGNvbnN0IG1ldGFLZXlzID0gdXBkYXRlcy5tYXAoKHsga2V5IH0pID0+IGdldE1ldGFLZXkoa2V5KSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzdG9yYWdlQXJlYSwgbWV0YUtleXMpO1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdNZXRhcyA9IGF3YWl0IGRyaXZlci5nZXRJdGVtcyhtZXRhS2V5cyk7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ01ldGFNYXAgPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgICAgICAgIGV4aXN0aW5nTWV0YXMubWFwKCh7IGtleSwgdmFsdWUgfSkgPT4gW2tleSwgZ2V0TWV0YVZhbHVlKHZhbHVlKV0pXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgbWV0YVVwZGF0ZXMgPSB1cGRhdGVzLm1hcCgoeyBrZXksIHByb3BlcnRpZXMgfSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBtZXRhS2V5ID0gZ2V0TWV0YUtleShrZXkpO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGtleTogbWV0YUtleSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbWVyZ2VNZXRhKGV4aXN0aW5nTWV0YU1hcFttZXRhS2V5XSA/PyB7fSwgcHJvcGVydGllcylcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgZHJpdmVyLnNldEl0ZW1zKG1ldGFVcGRhdGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmVJdGVtOiBhc3luYyAoa2V5LCBvcHRzKSA9PiB7XG4gICAgICBjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG4gICAgICBhd2FpdCByZW1vdmVJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcbiAgICB9LFxuICAgIHJlbW92ZUl0ZW1zOiBhc3luYyAoa2V5cykgPT4ge1xuICAgICAgY29uc3QgYXJlYVRvS2V5c01hcCA9IHt9O1xuICAgICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgbGV0IGtleVN0cjtcbiAgICAgICAgbGV0IG9wdHM7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAga2V5U3RyID0ga2V5O1xuICAgICAgICB9IGVsc2UgaWYgKFwiZ2V0VmFsdWVcIiBpbiBrZXkpIHtcbiAgICAgICAgICBrZXlTdHIgPSBrZXkua2V5O1xuICAgICAgICB9IGVsc2UgaWYgKFwiaXRlbVwiIGluIGtleSkge1xuICAgICAgICAgIGtleVN0ciA9IGtleS5pdGVtLmtleTtcbiAgICAgICAgICBvcHRzID0ga2V5Lm9wdGlvbnM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAga2V5U3RyID0ga2V5LmtleTtcbiAgICAgICAgICBvcHRzID0ga2V5Lm9wdGlvbnM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5U3RyKTtcbiAgICAgICAgYXJlYVRvS2V5c01hcFtkcml2ZXJBcmVhXSA/PyAoYXJlYVRvS2V5c01hcFtkcml2ZXJBcmVhXSA9IFtdKTtcbiAgICAgICAgYXJlYVRvS2V5c01hcFtkcml2ZXJBcmVhXS5wdXNoKGRyaXZlcktleSk7XG4gICAgICAgIGlmIChvcHRzPy5yZW1vdmVNZXRhKSB7XG4gICAgICAgICAgYXJlYVRvS2V5c01hcFtkcml2ZXJBcmVhXS5wdXNoKGdldE1ldGFLZXkoZHJpdmVyS2V5KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGFyZWFUb0tleXNNYXApLm1hcChhc3luYyAoW2RyaXZlckFyZWEsIGtleXMyXSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRyaXZlciA9IGdldERyaXZlcihkcml2ZXJBcmVhKTtcbiAgICAgICAgICBhd2FpdCBkcml2ZXIucmVtb3ZlSXRlbXMoa2V5czIpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZU1ldGE6IGFzeW5jIChrZXksIHByb3BlcnRpZXMpID0+IHtcbiAgICAgIGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcbiAgICAgIGF3YWl0IHJlbW92ZU1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpO1xuICAgIH0sXG4gICAgc25hcHNob3Q6IGFzeW5jIChiYXNlLCBvcHRzKSA9PiB7XG4gICAgICBjb25zdCBkcml2ZXIgPSBnZXREcml2ZXIoYmFzZSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZHJpdmVyLnNuYXBzaG90KCk7XG4gICAgICBvcHRzPy5leGNsdWRlS2V5cz8uZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGRlbGV0ZSBkYXRhW2tleV07XG4gICAgICAgIGRlbGV0ZSBkYXRhW2dldE1ldGFLZXkoa2V5KV07XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG4gICAgcmVzdG9yZVNuYXBzaG90OiBhc3luYyAoYmFzZSwgZGF0YSkgPT4ge1xuICAgICAgY29uc3QgZHJpdmVyID0gZ2V0RHJpdmVyKGJhc2UpO1xuICAgICAgYXdhaXQgZHJpdmVyLnJlc3RvcmVTbmFwc2hvdChkYXRhKTtcbiAgICB9LFxuICAgIHdhdGNoOiAoa2V5LCBjYikgPT4ge1xuICAgICAgY29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuICAgICAgcmV0dXJuIHdhdGNoKGRyaXZlciwgZHJpdmVyS2V5LCBjYik7XG4gICAgfSxcbiAgICB1bndhdGNoKCkge1xuICAgICAgT2JqZWN0LnZhbHVlcyhkcml2ZXJzKS5mb3JFYWNoKChkcml2ZXIpID0+IHtcbiAgICAgICAgZHJpdmVyLnVud2F0Y2goKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVmaW5lSXRlbTogKGtleSwgb3B0cykgPT4ge1xuICAgICAgY29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuICAgICAgY29uc3QgeyB2ZXJzaW9uOiB0YXJnZXRWZXJzaW9uID0gMSwgbWlncmF0aW9ucyA9IHt9IH0gPSBvcHRzID8/IHt9O1xuICAgICAgaWYgKHRhcmdldFZlcnNpb24gPCAxKSB7XG4gICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgIFwiU3RvcmFnZSBpdGVtIHZlcnNpb24gY2Fubm90IGJlIGxlc3MgdGhhbiAxLiBJbml0aWFsIHZlcnNpb25zIHNob3VsZCBiZSBzZXQgdG8gMSwgbm90IDAuXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1pZ3JhdGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRyaXZlck1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG4gICAgICAgIGNvbnN0IFt7IHZhbHVlIH0sIHsgdmFsdWU6IG1ldGEgfV0gPSBhd2FpdCBkcml2ZXIuZ2V0SXRlbXMoW1xuICAgICAgICAgIGRyaXZlcktleSxcbiAgICAgICAgICBkcml2ZXJNZXRhS2V5XG4gICAgICAgIF0pO1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gbWV0YT8udiA/PyAxO1xuICAgICAgICBpZiAoY3VycmVudFZlcnNpb24gPiB0YXJnZXRWZXJzaW9uKSB7XG4gICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICBgVmVyc2lvbiBkb3duZ3JhZGUgZGV0ZWN0ZWQgKHYke2N1cnJlbnRWZXJzaW9ufSAtPiB2JHt0YXJnZXRWZXJzaW9ufSkgZm9yIFwiJHtrZXl9XCJgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKFxuICAgICAgICAgIGBbQHd4dC1kZXYvc3RvcmFnZV0gUnVubmluZyBzdG9yYWdlIG1pZ3JhdGlvbiBmb3IgJHtrZXl9OiB2JHtjdXJyZW50VmVyc2lvbn0gLT4gdiR7dGFyZ2V0VmVyc2lvbn1gXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IG1pZ3JhdGlvbnNUb1J1biA9IEFycmF5LmZyb20oXG4gICAgICAgICAgeyBsZW5ndGg6IHRhcmdldFZlcnNpb24gLSBjdXJyZW50VmVyc2lvbiB9LFxuICAgICAgICAgIChfLCBpKSA9PiBjdXJyZW50VmVyc2lvbiArIGkgKyAxXG4gICAgICAgICk7XG4gICAgICAgIGxldCBtaWdyYXRlZFZhbHVlID0gdmFsdWU7XG4gICAgICAgIGZvciAoY29uc3QgbWlncmF0ZVRvVmVyc2lvbiBvZiBtaWdyYXRpb25zVG9SdW4pIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbWlncmF0ZWRWYWx1ZSA9IGF3YWl0IG1pZ3JhdGlvbnM/LlttaWdyYXRlVG9WZXJzaW9uXT8uKG1pZ3JhdGVkVmFsdWUpID8/IG1pZ3JhdGVkVmFsdWU7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcihgdiR7bWlncmF0ZVRvVmVyc2lvbn0gbWlncmF0aW9uIGZhaWxlZCBmb3IgXCIke2tleX1cImAsIHtcbiAgICAgICAgICAgICAgY2F1c2U6IGVyclxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGRyaXZlci5zZXRJdGVtcyhbXG4gICAgICAgICAgeyBrZXk6IGRyaXZlcktleSwgdmFsdWU6IG1pZ3JhdGVkVmFsdWUgfSxcbiAgICAgICAgICB7IGtleTogZHJpdmVyTWV0YUtleSwgdmFsdWU6IHsgLi4ubWV0YSwgdjogdGFyZ2V0VmVyc2lvbiB9IH1cbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgICAgYFtAd3h0LWRldi9zdG9yYWdlXSBTdG9yYWdlIG1pZ3JhdGlvbiBjb21wbGV0ZWQgZm9yICR7a2V5fSB2JHt0YXJnZXRWZXJzaW9ufWAsXG4gICAgICAgICAgeyBtaWdyYXRlZFZhbHVlIH1cbiAgICAgICAgKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBtaWdyYXRpb25zRG9uZSA9IG9wdHM/Lm1pZ3JhdGlvbnMgPT0gbnVsbCA/IFByb21pc2UucmVzb2x2ZSgpIDogbWlncmF0ZSgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBgW0B3eHQtZGV2L3N0b3JhZ2VdIE1pZ3JhdGlvbiBmYWlsZWQgZm9yICR7a2V5fWAsXG4gICAgICAgICAgZXJyXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGluaXRNdXRleCA9IG5ldyBNdXRleCgpO1xuICAgICAgY29uc3QgZ2V0RmFsbGJhY2sgPSAoKSA9PiBvcHRzPy5mYWxsYmFjayA/PyBvcHRzPy5kZWZhdWx0VmFsdWUgPz8gbnVsbDtcbiAgICAgIGNvbnN0IGdldE9ySW5pdFZhbHVlID0gKCkgPT4gaW5pdE11dGV4LnJ1bkV4Y2x1c2l2ZShhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgZHJpdmVyLmdldEl0ZW0oZHJpdmVyS2V5KTtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwgfHwgb3B0cz8uaW5pdCA9PSBudWxsKVxuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBhd2FpdCBvcHRzLmluaXQoKTtcbiAgICAgICAgYXdhaXQgZHJpdmVyLnNldEl0ZW0oZHJpdmVyS2V5LCBuZXdWYWx1ZSk7XG4gICAgICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgICAgIH0pO1xuICAgICAgbWlncmF0aW9uc0RvbmUudGhlbihnZXRPckluaXRWYWx1ZSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXksXG4gICAgICAgIGdldCBkZWZhdWx0VmFsdWUoKSB7XG4gICAgICAgICAgcmV0dXJuIGdldEZhbGxiYWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldCBmYWxsYmFjaygpIHtcbiAgICAgICAgICByZXR1cm4gZ2V0RmFsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0VmFsdWU6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCBtaWdyYXRpb25zRG9uZTtcbiAgICAgICAgICBpZiAob3B0cz8uaW5pdCkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGdldE9ySW5pdFZhbHVlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBnZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGdldE1ldGE6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCBtaWdyYXRpb25zRG9uZTtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgZ2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldFZhbHVlOiBhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCBtaWdyYXRpb25zRG9uZTtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgc2V0SXRlbShkcml2ZXIsIGRyaXZlcktleSwgdmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICBzZXRNZXRhOiBhc3luYyAocHJvcGVydGllcykgPT4ge1xuICAgICAgICAgIGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuICAgICAgICAgIHJldHVybiBhd2FpdCBzZXRNZXRhKGRyaXZlciwgZHJpdmVyS2V5LCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlVmFsdWU6IGFzeW5jIChvcHRzMikgPT4ge1xuICAgICAgICAgIGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuICAgICAgICAgIHJldHVybiBhd2FpdCByZW1vdmVJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzMik7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZU1ldGE6IGFzeW5jIChwcm9wZXJ0aWVzKSA9PiB7XG4gICAgICAgICAgYXdhaXQgbWlncmF0aW9uc0RvbmU7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHJlbW92ZU1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpO1xuICAgICAgICB9LFxuICAgICAgICB3YXRjaDogKGNiKSA9PiB3YXRjaChcbiAgICAgICAgICBkcml2ZXIsXG4gICAgICAgICAgZHJpdmVyS2V5LFxuICAgICAgICAgIChuZXdWYWx1ZSwgb2xkVmFsdWUpID0+IGNiKG5ld1ZhbHVlID8/IGdldEZhbGxiYWNrKCksIG9sZFZhbHVlID8/IGdldEZhbGxiYWNrKCkpXG4gICAgICAgICksXG4gICAgICAgIG1pZ3JhdGVcbiAgICAgIH07XG4gICAgfVxuICB9O1xuICByZXR1cm4gc3RvcmFnZTI7XG59XG5mdW5jdGlvbiBjcmVhdGVEcml2ZXIoc3RvcmFnZUFyZWEpIHtcbiAgY29uc3QgZ2V0U3RvcmFnZUFyZWEgPSAoKSA9PiB7XG4gICAgaWYgKGJyb3dzZXIucnVudGltZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgW1xuICAgICAgICAgIFwiJ3d4dC9zdG9yYWdlJyBtdXN0IGJlIGxvYWRlZCBpbiBhIHdlYiBleHRlbnNpb24gZW52aXJvbm1lbnRcIixcbiAgICAgICAgICBcIlxcbiAtIElmIHRocm93biBkdXJpbmcgYSBidWlsZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93eHQtZGV2L3d4dC9pc3N1ZXMvMzcxXCIsXG4gICAgICAgICAgXCIgLSBJZiB0aHJvd24gZHVyaW5nIHRlc3RzLCBtb2NrICd3eHQvYnJvd3NlcicgY29ycmVjdGx5LiBTZWUgaHR0cHM6Ly93eHQuZGV2L2d1aWRlL2dvLWZ1cnRoZXIvdGVzdGluZy5odG1sXFxuXCJcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoYnJvd3Nlci5zdG9yYWdlID09IG51bGwpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBcIllvdSBtdXN0IGFkZCB0aGUgJ3N0b3JhZ2UnIHBlcm1pc3Npb24gdG8geW91ciBtYW5pZmVzdCB0byB1c2UgJ3d4dC9zdG9yYWdlJ1wiXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBhcmVhID0gYnJvd3Nlci5zdG9yYWdlW3N0b3JhZ2VBcmVhXTtcbiAgICBpZiAoYXJlYSA9PSBudWxsKVxuICAgICAgdGhyb3cgRXJyb3IoYFwiYnJvd3Nlci5zdG9yYWdlLiR7c3RvcmFnZUFyZWF9XCIgaXMgdW5kZWZpbmVkYCk7XG4gICAgcmV0dXJuIGFyZWE7XG4gIH07XG4gIGNvbnN0IHdhdGNoTGlzdGVuZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbiAgcmV0dXJuIHtcbiAgICBnZXRJdGVtOiBhc3luYyAoa2V5KSA9PiB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldChrZXkpO1xuICAgICAgcmV0dXJuIHJlc1trZXldO1xuICAgIH0sXG4gICAgZ2V0SXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldChrZXlzKTtcbiAgICAgIHJldHVybiBrZXlzLm1hcCgoa2V5KSA9PiAoeyBrZXksIHZhbHVlOiByZXN1bHRba2V5XSA/PyBudWxsIH0pKTtcbiAgICB9LFxuICAgIHNldEl0ZW06IGFzeW5jIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnJlbW92ZShrZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5zZXQoeyBba2V5XTogdmFsdWUgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBzZXRJdGVtczogYXN5bmMgKHZhbHVlcykgPT4ge1xuICAgICAgY29uc3QgbWFwID0gdmFsdWVzLnJlZHVjZShcbiAgICAgICAgKG1hcDIsIHsga2V5LCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgICAgbWFwMltrZXldID0gdmFsdWU7XG4gICAgICAgICAgcmV0dXJuIG1hcDI7XG4gICAgICAgIH0sXG4gICAgICAgIHt9XG4gICAgICApO1xuICAgICAgYXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5zZXQobWFwKTtcbiAgICB9LFxuICAgIHJlbW92ZUl0ZW06IGFzeW5jIChrZXkpID0+IHtcbiAgICAgIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkucmVtb3ZlKGtleSk7XG4gICAgfSxcbiAgICByZW1vdmVJdGVtczogYXN5bmMgKGtleXMpID0+IHtcbiAgICAgIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkucmVtb3ZlKGtleXMpO1xuICAgIH0sXG4gICAgc25hcHNob3Q6IGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldCgpO1xuICAgIH0sXG4gICAgcmVzdG9yZVNuYXBzaG90OiBhc3luYyAoZGF0YSkgPT4ge1xuICAgICAgYXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5zZXQoZGF0YSk7XG4gICAgfSxcbiAgICB3YXRjaChrZXksIGNiKSB7XG4gICAgICBjb25zdCBsaXN0ZW5lciA9IChjaGFuZ2VzKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoYW5nZSA9IGNoYW5nZXNba2V5XTtcbiAgICAgICAgaWYgKGNoYW5nZSA9PSBudWxsKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKGRlcXVhbChjaGFuZ2UubmV3VmFsdWUsIGNoYW5nZS5vbGRWYWx1ZSkpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjYihjaGFuZ2UubmV3VmFsdWUgPz8gbnVsbCwgY2hhbmdlLm9sZFZhbHVlID8/IG51bGwpO1xuICAgICAgfTtcbiAgICAgIGdldFN0b3JhZ2VBcmVhKCkub25DaGFuZ2VkLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgIHdhdGNoTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBnZXRTdG9yYWdlQXJlYSgpLm9uQ2hhbmdlZC5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgIHdhdGNoTGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICB9O1xuICAgIH0sXG4gICAgdW53YXRjaCgpIHtcbiAgICAgIHdhdGNoTGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICAgIGdldFN0b3JhZ2VBcmVhKCkub25DaGFuZ2VkLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgICAgd2F0Y2hMaXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG4gIH07XG59XG5jbGFzcyBNaWdyYXRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3Ioa2V5LCB2ZXJzaW9uLCBvcHRpb25zKSB7XG4gICAgc3VwZXIoYHYke3ZlcnNpb259IG1pZ3JhdGlvbiBmYWlsZWQgZm9yIFwiJHtrZXl9XCJgLCBvcHRpb25zKTtcbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICB0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICB9XG59XG5cbmV4cG9ydCB7IE1pZ3JhdGlvbkVycm9yLCBzdG9yYWdlIH07XG4iLCJleHBvcnQgY29uc3QgQ09OVEVOVF9TQ1JJUFRfTUFUQ0hFUyA9IFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vKlwiOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIExhc3QgdGltZSB1cGRhdGVkOiAyMDIxLTAzLTA5IDM6MjA6MjIgQU0gVVRDXHJcblxyXG4vLyBfX19fX19fX19fX19fX19fXHJcbi8vIFJlY29yZFJUQyB2NS42LjJcclxuXHJcbi8vIE9wZW4tU291cmNlZDogaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVENcclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIE11YXogS2hhbiAgICAgLSB3d3cuTXVhektoYW4uY29tXHJcbi8vIE1JVCBMaWNlbnNlICAgLSB3d3cuV2ViUlRDLUV4cGVyaW1lbnQuY29tL2xpY2VuY2VcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbi8vIF9fX19fX19fX19fX1xyXG4vLyBSZWNvcmRSVEMuanNcclxuXHJcbi8qKlxyXG4gKiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEN8UmVjb3JkUlRDfSBpcyBhIFdlYlJUQyBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGF1ZGlvL3ZpZGVvIGFzIHdlbGwgYXMgc2NyZWVuIGFjdGl2aXR5IHJlY29yZGluZy4gSXQgc3VwcG9ydHMgQ2hyb21lLCBGaXJlZm94LCBPcGVyYSwgQW5kcm9pZCwgYW5kIE1pY3Jvc29mdCBFZGdlLiBQbGF0Zm9ybXM6IExpbnV4LCBNYWMgYW5kIFdpbmRvd3MuIFxyXG4gKiBAc3VtbWFyeSBSZWNvcmQgYXVkaW8sIHZpZGVvIG9yIHNjcmVlbiBpbnNpZGUgdGhlIGJyb3dzZXIuXHJcbiAqIEBsaWNlbnNlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQy9ibG9iL21hc3Rlci9MSUNFTlNFfE1JVH1cclxuICogQGF1dGhvciB7QGxpbmsgaHR0cHM6Ly9NdWF6S2hhbi5jb218TXVheiBLaGFufVxyXG4gKiBAdHlwZWRlZiBSZWNvcmRSVENcclxuICogQGNsYXNzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciByZWNvcmRlciA9IFJlY29yZFJUQyhtZWRpYVN0cmVhbSBvciBbYXJyYXlPZk1lZGlhU3RyZWFtXSwge1xyXG4gKiAgICAgdHlwZTogJ3ZpZGVvJywgLy8gYXVkaW8gb3IgdmlkZW8gb3IgZ2lmIG9yIGNhbnZhc1xyXG4gKiAgICAgcmVjb3JkZXJUeXBlOiBNZWRpYVN0cmVhbVJlY29yZGVyIHx8IENhbnZhc1JlY29yZGVyIHx8IFN0ZXJlb0F1ZGlvUmVjb3JkZXIgfHwgRXRjXHJcbiAqIH0pO1xyXG4gKiByZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xyXG4gKiBAc2VlIEZvciBmdXJ0aGVyIGluZm9ybWF0aW9uOlxyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQ3xSZWNvcmRSVEMgU291cmNlIENvZGV9XHJcbiAqIEBwYXJhbSB7TWVkaWFTdHJlYW19IG1lZGlhU3RyZWFtIC0gU2luZ2xlIG1lZGlhLXN0cmVhbSBvYmplY3QsIGFycmF5IG9mIG1lZGlhLXN0cmVhbXMsIGh0bWwtY2FudmFzLWVsZW1lbnQsIGV0Yy5cclxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyAtIHt0eXBlOlwidmlkZW9cIiwgcmVjb3JkZXJUeXBlOiBNZWRpYVN0cmVhbVJlY29yZGVyLCBkaXNhYmxlTG9nczogdHJ1ZSwgbnVtYmVyT2ZBdWRpb0NoYW5uZWxzOiAxLCBidWZmZXJTaXplOiAwLCBzYW1wbGVSYXRlOiAwLCBkZXNpcmVkU2FtcFJhdGU6IDE2MDAwLCB2aWRlbzogSFRNTFZpZGVvRWxlbWVudCwgZXRjLn1cclxuICovXHJcblxyXG5mdW5jdGlvbiBSZWNvcmRSVEMobWVkaWFTdHJlYW0sIGNvbmZpZykge1xyXG4gICAgaWYgKCFtZWRpYVN0cmVhbSkge1xyXG4gICAgICAgIHRocm93ICdGaXJzdCBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuJztcclxuICAgIH1cclxuXHJcbiAgICBjb25maWcgPSBjb25maWcgfHwge1xyXG4gICAgICAgIHR5cGU6ICd2aWRlbydcclxuICAgIH07XHJcblxyXG4gICAgY29uZmlnID0gbmV3IFJlY29yZFJUQ0NvbmZpZ3VyYXRpb24obWVkaWFTdHJlYW0sIGNvbmZpZyk7XHJcblxyXG4gICAgLy8gYSByZWZlcmVuY2UgdG8gdXNlcidzIHJlY29yZFJUQyBvYmplY3RcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBzdGFydFJlY29yZGluZyhjb25maWcyKSB7XHJcbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlY29yZFJUQyB2ZXJzaW9uOiAnLCBzZWxmLnZlcnNpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEhY29uZmlnMikge1xyXG4gICAgICAgICAgICAvLyBhbGxvdyB1c2VycyB0byBzZXQgb3B0aW9ucyB1c2luZyBzdGFydFJlY29yZGluZyBtZXRob2RcclxuICAgICAgICAgICAgLy8gY29uZmlnMiBpcyBzaW1pbGFyIHRvIG1haW4gXCJjb25maWdcIiBvYmplY3QgKHNlY29uZCBwYXJhbWV0ZXIgb3ZlciBSZWNvcmRSVEMgY29uc3RydWN0b3IpXHJcbiAgICAgICAgICAgIGNvbmZpZyA9IG5ldyBSZWNvcmRSVENDb25maWd1cmF0aW9uKG1lZGlhU3RyZWFtLCBjb25maWcyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdGFydGVkIHJlY29yZGluZyAnICsgY29uZmlnLnR5cGUgKyAnIHN0cmVhbS4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZWRpYVJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIG1lZGlhUmVjb3JkZXIuY2xlYXJSZWNvcmRlZERhdGEoKTtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5yZWNvcmQoKTtcclxuXHJcbiAgICAgICAgICAgIHNldFN0YXRlKCdyZWNvcmRpbmcnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxmLnJlY29yZGluZ0R1cmF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVSZWNvcmRpbmdEdXJhdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5pdFJlY29yZGVyKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5yZWNvcmRpbmdEdXJhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlUmVjb3JkaW5nRHVyYXRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc2VsZjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbml0UmVjb3JkZXIoaW5pdENhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKGluaXRDYWxsYmFjaykge1xyXG4gICAgICAgICAgICBjb25maWcuaW5pdENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBpbml0Q2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgIGluaXRDYWxsYmFjayA9IGNvbmZpZy5pbml0Q2FsbGJhY2sgPSBudWxsOyAvLyByZWNvcmRlci5pbml0UmVjb3JkZXIgc2hvdWxkIGJlIGNhbGwtYmFja2VkIG9uY2UuXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgUmVjb3JkZXIgPSBuZXcgR2V0UmVjb3JkZXJUeXBlKG1lZGlhU3RyZWFtLCBjb25maWcpO1xyXG5cclxuICAgICAgICBtZWRpYVJlY29yZGVyID0gbmV3IFJlY29yZGVyKG1lZGlhU3RyZWFtLCBjb25maWcpO1xyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIucmVjb3JkKCk7XHJcblxyXG4gICAgICAgIHNldFN0YXRlKCdyZWNvcmRpbmcnKTtcclxuXHJcbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0luaXRpYWxpemVkIHJlY29yZGVyVHlwZTonLCBtZWRpYVJlY29yZGVyLmNvbnN0cnVjdG9yLm5hbWUsICdmb3Igb3V0cHV0LXR5cGU6JywgY29uZmlnLnR5cGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9wUmVjb3JkaW5nKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xyXG5cclxuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgd2FybmluZ0xvZygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3BhdXNlZCcpIHtcclxuICAgICAgICAgICAgc2VsZi5yZXN1bWVSZWNvcmRpbmcoKTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9wUmVjb3JkaW5nKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9PSAncmVjb3JkaW5nJyAmJiAhY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUmVjb3JkaW5nIHN0YXRlIHNob3VsZCBiZTogXCJyZWNvcmRpbmdcIiwgaG93ZXZlciBjdXJyZW50IHN0YXRlIGlzOiAnLCBzZWxmLnN0YXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTdG9wcGVkIHJlY29yZGluZyAnICsgY29uZmlnLnR5cGUgKyAnIHN0cmVhbS4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb25maWcudHlwZSAhPT0gJ2dpZicpIHtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5zdG9wKF9jYWxsYmFjayk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5zdG9wKCk7XHJcbiAgICAgICAgICAgIF9jYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0U3RhdGUoJ3N0b3BwZWQnKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX2NhbGxiYWNrKF9fYmxvYikge1xyXG4gICAgICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2suY2FsbCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoc2VsZiwgJycpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygnJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG1lZGlhUmVjb3JkZXIpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1lZGlhUmVjb3JkZXJba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmW2tleV0gPSBtZWRpYVJlY29yZGVyW2tleV07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIGJsb2IgPSBtZWRpYVJlY29yZGVyLmJsb2I7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWJsb2IpIHtcclxuICAgICAgICAgICAgICAgIGlmIChfX2Jsb2IpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZWRpYVJlY29yZGVyLmJsb2IgPSBibG9iID0gX19ibG9iO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnUmVjb3JkaW5nIGZhaWxlZC4nO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYmxvYiAmJiAhY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhibG9iLnR5cGUsICctPicsIGJ5dGVzVG9TaXplKGJsb2Iuc2l6ZSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIHZhciB1cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrLmNhbGwgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKHNlbGYsIHVybCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHVybCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLmF1dG9Xcml0ZVRvRGlzaykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZXREYXRhVVJMKGZ1bmN0aW9uKGRhdGFVUkwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbWV0ZXIgPSB7fTtcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcltjb25maWcudHlwZSArICdCbG9iJ10gPSBkYXRhVVJMO1xyXG4gICAgICAgICAgICAgICAgRGlza1N0b3JhZ2UuU3RvcmUocGFyYW1ldGVyKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhdXNlUmVjb3JkaW5nKCkge1xyXG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xyXG4gICAgICAgICAgICB3YXJuaW5nTG9nKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9PSAncmVjb3JkaW5nJykge1xyXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdVbmFibGUgdG8gcGF1c2UgdGhlIHJlY29yZGluZy4gUmVjb3JkaW5nIHN0YXRlOiAnLCBzZWxmLnN0YXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXRTdGF0ZSgncGF1c2VkJyk7XHJcblxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIucGF1c2UoKTtcclxuXHJcbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1BhdXNlZCByZWNvcmRpbmcuJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3VtZVJlY29yZGluZygpIHtcclxuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgd2FybmluZ0xvZygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5zdGF0ZSAhPT0gJ3BhdXNlZCcpIHtcclxuICAgICAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVW5hYmxlIHRvIHJlc3VtZSB0aGUgcmVjb3JkaW5nLiBSZWNvcmRpbmcgc3RhdGU6ICcsIHNlbGYuc3RhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldFN0YXRlKCdyZWNvcmRpbmcnKTtcclxuXHJcbiAgICAgICAgLy8gbm90IGFsbCBsaWJzIGhhdmUgdGhpcyBtZXRob2QgeWV0XHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5yZXN1bWUoKTtcclxuXHJcbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1Jlc3VtZWQgcmVjb3JkaW5nLicpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZWFkRmlsZShfYmxvYikge1xyXG4gICAgICAgIHBvc3RNZXNzYWdlKG5ldyBGaWxlUmVhZGVyU3luYygpLnJlYWRBc0RhdGFVUkwoX2Jsb2IpKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXREYXRhVVJMKGNhbGxiYWNrLCBfbWVkaWFSZWNvcmRlcikge1xyXG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1Bhc3MgYSBjYWxsYmFjayBmdW5jdGlvbiBvdmVyIGdldERhdGFVUkwuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBibG9iID0gX21lZGlhUmVjb3JkZXIgPyBfbWVkaWFSZWNvcmRlci5ibG9iIDogKG1lZGlhUmVjb3JkZXIgfHwge30pLmJsb2I7XHJcblxyXG4gICAgICAgIGlmICghYmxvYikge1xyXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdCbG9iIGVuY29kZXIgZGlkIG5vdCBmaW5pc2ggaXRzIGpvYiB5ZXQuJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBnZXREYXRhVVJMKGNhbGxiYWNrLCBfbWVkaWFSZWNvcmRlcik7XHJcbiAgICAgICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIFdvcmtlciAhPT0gJ3VuZGVmaW5lZCcgJiYgIW5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEpIHtcclxuICAgICAgICAgICAgdmFyIHdlYldvcmtlciA9IHByb2Nlc3NJbldlYldvcmtlcihyZWFkRmlsZSk7XHJcblxyXG4gICAgICAgICAgICB3ZWJXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50LmRhdGEpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgd2ViV29ya2VyLnBvc3RNZXNzYWdlKGJsb2IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldmVudC50YXJnZXQucmVzdWx0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NJbldlYldvcmtlcihfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBibG9iID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbX2Z1bmN0aW9uLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RoaXMub25tZXNzYWdlID0gIGZ1bmN0aW9uIChlZWUpIHsnICsgX2Z1bmN0aW9uLm5hbWUgKyAnKGVlZS5kYXRhKTt9J1xyXG4gICAgICAgICAgICAgICAgXSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0J1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKGJsb2IpO1xyXG4gICAgICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZXI7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlY29yZGluZ0R1cmF0aW9uKGNvdW50ZXIpIHtcclxuICAgICAgICBjb3VudGVyID0gY291bnRlciB8fCAwO1xyXG5cclxuICAgICAgICBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3BhdXNlZCcpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVJlY29yZGluZ0R1cmF0aW9uKGNvdW50ZXIpO1xyXG4gICAgICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgPT09ICdzdG9wcGVkJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY291bnRlciA+PSBzZWxmLnJlY29yZGluZ0R1cmF0aW9uKSB7XHJcbiAgICAgICAgICAgIHN0b3BSZWNvcmRpbmcoc2VsZi5vblJlY29yZGluZ1N0b3BwZWQpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb3VudGVyICs9IDEwMDA7IC8vIDEtc2Vjb25kXHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZVJlY29yZGluZ0R1cmF0aW9uKGNvdW50ZXIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldFN0YXRlKHN0YXRlKSB7XHJcbiAgICAgICAgaWYgKCFzZWxmKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYuc3RhdGUgPSBzdGF0ZTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzZWxmLm9uU3RhdGVDaGFuZ2VkLmNhbGwgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgc2VsZi5vblN0YXRlQ2hhbmdlZC5jYWxsKHNlbGYsIHN0YXRlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxmLm9uU3RhdGVDaGFuZ2VkKHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIFdBUk5JTkcgPSAnSXQgc2VlbXMgdGhhdCByZWNvcmRlciBpcyBkZXN0cm95ZWQgb3IgXCJzdGFydFJlY29yZGluZ1wiIGlzIG5vdCBpbnZva2VkIGZvciAnICsgY29uZmlnLnR5cGUgKyAnIHJlY29yZGVyLic7XHJcblxyXG4gICAgZnVuY3Rpb24gd2FybmluZ0xvZygpIHtcclxuICAgICAgICBpZiAoY29uZmlnLmRpc2FibGVMb2dzID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUud2FybihXQVJOSU5HKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbWVkaWFSZWNvcmRlcjtcclxuXHJcbiAgICB2YXIgcmV0dXJuT2JqZWN0ID0ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIHN0YXJ0cyB0aGUgcmVjb3JkaW5nLlxyXG4gICAgICAgICAqIEBtZXRob2RcclxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXHJcbiAgICAgICAgICogQGluc3RhbmNlXHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiB2YXIgcmVjb3JkZXIgPSBSZWNvcmRSVEMobWVkaWFTdHJlYW0sIHtcclxuICAgICAgICAgKiAgICAgdHlwZTogJ3ZpZGVvJ1xyXG4gICAgICAgICAqIH0pO1xyXG4gICAgICAgICAqIHJlY29yZGVyLnN0YXJ0UmVjb3JkaW5nKCk7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc3RhcnRSZWNvcmRpbmc6IHN0YXJ0UmVjb3JkaW5nLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyB0aGUgcmVjb3JkaW5nLiBJdCBpcyBzdHJvbmdseSByZWNvbW1lbmRlZCB0byBnZXQgXCJibG9iXCIgb3IgXCJVUklcIiBpbnNpZGUgdGhlIGNhbGxiYWNrIHRvIG1ha2Ugc3VyZSBhbGwgcmVjb3JkZXJzIGZpbmlzaGVkIHRoZWlyIGpvYi5cclxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIHRvIGdldCB0aGUgcmVjb3JkZWQgYmxvYi5cclxuICAgICAgICAgKiBAbWV0aG9kXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogcmVjb3JkZXIuc3RvcFJlY29yZGluZyhmdW5jdGlvbigpIHtcclxuICAgICAgICAgKiAgICAgLy8gdXNlIGVpdGhlciBcInRoaXNcIiBvciBcInJlY29yZGVyXCIgb2JqZWN0OyBib3RoIGFyZSBpZGVudGljYWxcclxuICAgICAgICAgKiAgICAgdmlkZW8uc3JjID0gdGhpcy50b1VSTCgpO1xyXG4gICAgICAgICAqICAgICB2YXIgYmxvYiA9IHRoaXMuZ2V0QmxvYigpO1xyXG4gICAgICAgICAqIH0pO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHN0b3BSZWNvcmRpbmc6IHN0b3BSZWNvcmRpbmcsXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nLiBZb3UgY2FuIHJlc3VtZSByZWNvcmRpbmcgdXNpbmcgXCJyZXN1bWVSZWNvcmRpbmdcIiBtZXRob2QuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKiBAdG9kbyBGaXJlZm94IGlzIHVuYWJsZSB0byBwYXVzZSB0aGUgcmVjb3JkaW5nLiBGaXggaXQuXHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiByZWNvcmRlci5wYXVzZVJlY29yZGluZygpOyAgLy8gcGF1c2UgdGhlIHJlY29yZGluZ1xyXG4gICAgICAgICAqIHJlY29yZGVyLnJlc3VtZVJlY29yZGluZygpOyAvLyByZXN1bWUgYWdhaW5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwYXVzZVJlY29yZGluZzogcGF1c2VSZWNvcmRpbmcsXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIHJlc3VtZXMgdGhlIHJlY29yZGluZy5cclxuICAgICAgICAgKiBAbWV0aG9kXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogcmVjb3JkZXIucGF1c2VSZWNvcmRpbmcoKTsgIC8vIGZpcnN0IG9mIGFsbCwgcGF1c2UgdGhlIHJlY29yZGluZ1xyXG4gICAgICAgICAqIHJlY29yZGVyLnJlc3VtZVJlY29yZGluZygpOyAvLyBub3cgcmVzdW1lIGl0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcmVzdW1lUmVjb3JkaW5nOiByZXN1bWVSZWNvcmRpbmcsXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGluaXRpYWxpemVzIHRoZSByZWNvcmRpbmcuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKiBAdG9kbyBUaGlzIG1ldGhvZCBzaG91bGQgYmUgZGVwcmVjYXRlZC5cclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHJlY29yZGVyLmluaXRSZWNvcmRlcigpO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGluaXRSZWNvcmRlcjogaW5pdFJlY29yZGVyLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBc2sgUmVjb3JkUlRDIHRvIGF1dG8tc3RvcCB0aGUgcmVjb3JkaW5nIGFmdGVyIDUgbWludXRlcy5cclxuICAgICAgICAgKiBAbWV0aG9kXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogdmFyIGZpdmVNaW51dGVzID0gNSAqIDEwMDAgKiA2MDtcclxuICAgICAgICAgKiByZWNvcmRlci5zZXRSZWNvcmRpbmdEdXJhdGlvbihmaXZlTWludXRlcywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICogICAgdmFyIGJsb2IgPSB0aGlzLmdldEJsb2IoKTtcclxuICAgICAgICAgKiAgICB2aWRlby5zcmMgPSB0aGlzLnRvVVJMKCk7XHJcbiAgICAgICAgICogfSk7XHJcbiAgICAgICAgICogXHJcbiAgICAgICAgICogLy8gb3Igb3RoZXJ3aXNlXHJcbiAgICAgICAgICogcmVjb3JkZXIuc2V0UmVjb3JkaW5nRHVyYXRpb24oZml2ZU1pbnV0ZXMpLm9uUmVjb3JkaW5nU3RvcHBlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgKiAgICB2YXIgYmxvYiA9IHRoaXMuZ2V0QmxvYigpO1xyXG4gICAgICAgICAqICAgIHZpZGVvLnNyYyA9IHRoaXMudG9VUkwoKTtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKi9cclxuICAgICAgICBzZXRSZWNvcmRpbmdEdXJhdGlvbjogZnVuY3Rpb24ocmVjb3JkaW5nRHVyYXRpb24sIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVjb3JkaW5nRHVyYXRpb24gPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAncmVjb3JkaW5nRHVyYXRpb24gaXMgcmVxdWlyZWQuJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiByZWNvcmRpbmdEdXJhdGlvbiAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdyZWNvcmRpbmdEdXJhdGlvbiBtdXN0IGJlIGEgbnVtYmVyLic7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYucmVjb3JkaW5nRHVyYXRpb24gPSByZWNvcmRpbmdEdXJhdGlvbjtcclxuICAgICAgICAgICAgc2VsZi5vblJlY29yZGluZ1N0b3BwZWQgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG9uUmVjb3JkaW5nU3RvcHBlZDogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm9uUmVjb3JkaW5nU3RvcHBlZCA9IGNhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGNhbiBiZSB1c2VkIHRvIGNsZWFyL3Jlc2V0IGFsbCB0aGUgcmVjb3JkZWQgZGF0YS5cclxuICAgICAgICAgKiBAbWV0aG9kXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICAgICAqIEB0b2RvIEZpZ3VyZSBvdXQgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBcInJlc2V0XCIgYW5kIFwiY2xlYXJSZWNvcmRlZERhdGFcIiBtZXRob2RzLlxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogcmVjb3JkZXIuY2xlYXJSZWNvcmRlZERhdGEoKTtcclxuICAgICAgICAgKi9cclxuICAgICAgICBjbGVhclJlY29yZGVkRGF0YTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xyXG4gICAgICAgICAgICAgICAgd2FybmluZ0xvZygpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLmNsZWFyUmVjb3JkZWREYXRhKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NsZWFyZWQgb2xkIHJlY29yZGVkIGRhdGEuJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgdGhlIHJlY29yZGVkIGJsb2IuIFVzZSB0aGlzIG1ldGhvZCBpbnNpZGUgdGhlIFwic3RvcFJlY29yZGluZ1wiIGNhbGxiYWNrLlxyXG4gICAgICAgICAqIEBtZXRob2RcclxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXHJcbiAgICAgICAgICogQGluc3RhbmNlXHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAqICAgICB2YXIgYmxvYiA9IHRoaXMuZ2V0QmxvYigpO1xyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogICAgIHZhciBmaWxlID0gbmV3IEZpbGUoW2Jsb2JdLCAnZmlsZW5hbWUud2VibScsIHtcclxuICAgICAgICAgKiAgICAgICAgIHR5cGU6ICd2aWRlby93ZWJtJ1xyXG4gICAgICAgICAqICAgICB9KTtcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICAgICAgICAgKiAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSk7IC8vIHVwbG9hZCBcIkZpbGVcIiBvYmplY3QgcmF0aGVyIHRoYW4gYSBcIkJsb2JcIlxyXG4gICAgICAgICAqICAgICB1cGxvYWRUb1NlcnZlcihmb3JtRGF0YSk7XHJcbiAgICAgICAgICogfSk7XHJcbiAgICAgICAgICogQHJldHVybnMge0Jsb2J9IFJldHVybnMgcmVjb3JkZWQgZGF0YSBhcyBcIkJsb2JcIiBvYmplY3QuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0QmxvYjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xyXG4gICAgICAgICAgICAgICAgd2FybmluZ0xvZygpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWVkaWFSZWNvcmRlci5ibG9iO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdldCBkYXRhLVVSSSBpbnN0ZWFkIG9mIEJsb2IuXHJcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB0byBnZXQgdGhlIERhdGEtVVJJLlxyXG4gICAgICAgICAqIEBtZXRob2RcclxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXHJcbiAgICAgICAgICogQGluc3RhbmNlXHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAqICAgICByZWNvcmRlci5nZXREYXRhVVJMKGZ1bmN0aW9uKGRhdGFVUkkpIHtcclxuICAgICAgICAgKiAgICAgICAgIHZpZGVvLnNyYyA9IGRhdGFVUkk7XHJcbiAgICAgICAgICogICAgIH0pO1xyXG4gICAgICAgICAqIH0pO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGdldERhdGFVUkw6IGdldERhdGFVUkwsXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdldCB2aXJ0dWFsL3RlbXBvcmFyeSBVUkwuIFVzYWdlIG9mIHRoaXMgVVJMIGlzIGxpbWl0ZWQgdG8gY3VycmVudCB0YWIuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHJlY29yZGVyLnN0b3BSZWNvcmRpbmcoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICogICAgIHZpZGVvLnNyYyA9IHRoaXMudG9VUkwoKTtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSBSZXR1cm5zIGEgdmlydHVhbC90ZW1wb3JhcnkgVVJMIGZvciB0aGUgcmVjb3JkZWQgXCJCbG9iXCIuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdG9VUkw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgICAgIHdhcm5pbmdMb2coKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwobWVkaWFSZWNvcmRlci5ibG9iKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgaW50ZXJuYWwgcmVjb3JkaW5nIG9iamVjdCAoaS5lLiBpbnRlcm5hbCBtb2R1bGUpIGUuZy4gTXV0bGlTdHJlYW1SZWNvcmRlciwgTWVkaWFTdHJlYW1SZWNvcmRlciwgU3RlcmVvQXVkaW9SZWNvcmRlciBvciBXaGFtbXlSZWNvcmRlciBldGMuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHZhciBpbnRlcm5hbFJlY29yZGVyID0gcmVjb3JkZXIuZ2V0SW50ZXJuYWxSZWNvcmRlcigpO1xyXG4gICAgICAgICAqIGlmKGludGVybmFsUmVjb3JkZXIgaW5zdGFuY2VvZiBNdWx0aVN0cmVhbVJlY29yZGVyKSB7XHJcbiAgICAgICAgICogICAgIGludGVybmFsUmVjb3JkZXIuYWRkU3RyZWFtcyhbbmV3QXVkaW9TdHJlYW1dKTtcclxuICAgICAgICAgKiAgICAgaW50ZXJuYWxSZWNvcmRlci5yZXNldFZpZGVvU3RyZWFtcyhbc2NyZWVuU3RyZWFtXSk7XHJcbiAgICAgICAgICogfVxyXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgaW50ZXJuYWwgcmVjb3JkaW5nIG9iamVjdC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBnZXRJbnRlcm5hbFJlY29yZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1lZGlhUmVjb3JkZXI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSW52b2tlIHNhdmUtYXMgZGlhbG9nIHRvIHNhdmUgdGhlIHJlY29yZGVkIGJsb2IgaW50byB5b3VyIGRpc2suXHJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVOYW1lIC0gU2V0IHlvdXIgb3duIGZpbGUgbmFtZS5cclxuICAgICAgICAgKiBAbWV0aG9kXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogcmVjb3JkZXIuc3RvcFJlY29yZGluZyhmdW5jdGlvbigpIHtcclxuICAgICAgICAgKiAgICAgdGhpcy5zYXZlKCdmaWxlLW5hbWUnKTtcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICAgICAvLyBvciBtYW51YWxseTpcclxuICAgICAgICAgKiAgICAgaW52b2tlU2F2ZUFzRGlhbG9nKHRoaXMuZ2V0QmxvYigpLCAnZmlsZW5hbWUud2VibScpO1xyXG4gICAgICAgICAqIH0pO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xyXG4gICAgICAgICAgICAgICAgd2FybmluZ0xvZygpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpbnZva2VTYXZlQXNEaWFsb2cobWVkaWFSZWNvcmRlci5ibG9iLCBmaWxlTmFtZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBtZXRob2QgZ2V0cyBhIGJsb2IgZnJvbSBpbmRleGVkLURCIHN0b3JhZ2UuXHJcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB0byBnZXQgdGhlIHJlY29yZGVkIGJsb2IuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHJlY29yZGVyLmdldEZyb21EaXNrKGZ1bmN0aW9uKGRhdGFVUkwpIHtcclxuICAgICAgICAgKiAgICAgdmlkZW8uc3JjID0gZGF0YVVSTDtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKi9cclxuICAgICAgICBnZXRGcm9tRGlzazogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgICAgICB3YXJuaW5nTG9nKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFJlY29yZFJUQy5nZXRGcm9tRGlzayhjb25maWcudHlwZSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGFwcGVuZHMgYW4gYXJyYXkgb2Ygd2VicCBpbWFnZXMgdG8gdGhlIHJlY29yZGVkIHZpZGVvLWJsb2IuIEl0IHRha2VzIGFuIFwiYXJyYXlcIiBvYmplY3QuXHJcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxBcnJheT59XHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXlPZldlYlBJbWFnZXMgLSBBcnJheSBvZiB3ZWJwIGltYWdlcy5cclxuICAgICAgICAgKiBAbWV0aG9kXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICAgICAqIEB0b2RvIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBkZXByZWNhdGVkLlxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogdmFyIGFycmF5T2ZXZWJQSW1hZ2VzID0gW107XHJcbiAgICAgICAgICogYXJyYXlPZldlYlBJbWFnZXMucHVzaCh7XHJcbiAgICAgICAgICogICAgIGR1cmF0aW9uOiBpbmRleCxcclxuICAgICAgICAgKiAgICAgaW1hZ2U6ICdkYXRhOmltYWdlL3dlYnA7YmFzZTY0LC4uLidcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKiByZWNvcmRlci5zZXRBZHZlcnRpc2VtZW50QXJyYXkoYXJyYXlPZldlYlBJbWFnZXMpO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNldEFkdmVydGlzZW1lbnRBcnJheTogZnVuY3Rpb24oYXJyYXlPZldlYlBJbWFnZXMpIHtcclxuICAgICAgICAgICAgY29uZmlnLmFkdmVydGlzZW1lbnQgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBhcnJheU9mV2ViUEltYWdlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5hZHZlcnRpc2VtZW50LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBpLFxyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiBhcnJheU9mV2ViUEltYWdlc1tpXVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBJdCBpcyBlcXVpdmFsZW50IHRvIDxjb2RlIGNsYXNzPVwic3RyXCI+XCJyZWNvcmRlci5nZXRCbG9iKClcIjwvY29kZT4gbWV0aG9kLiBVc2FnZSBvZiBcImdldEJsb2JcIiBpcyByZWNvbW1lbmRlZCwgdGhvdWdoLlxyXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7QmxvYn0gYmxvYiAtIFJlY29yZGVkIEJsb2IgY2FuIGJlIGFjY2Vzc2VkIHVzaW5nIHRoaXMgcHJvcGVydHkuXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogcmVjb3JkZXIuc3RvcFJlY29yZGluZyhmdW5jdGlvbigpIHtcclxuICAgICAgICAgKiAgICAgdmFyIGJsb2IgPSB0aGlzLmJsb2I7XHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAgICAgLy8gYmVsb3cgb25lIGlzIHJlY29tbWVuZGVkXHJcbiAgICAgICAgICogICAgIHZhciBibG9iID0gdGhpcy5nZXRCbG9iKCk7XHJcbiAgICAgICAgICogfSk7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgYmxvYjogbnVsbCxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyB3b3JrcyBvbmx5IHdpdGgge3JlY29yZGVyVHlwZTpTdGVyZW9BdWRpb1JlY29yZGVyfS4gVXNlIHRoaXMgcHJvcGVydHkgb24gXCJzdG9wUmVjb3JkaW5nXCIgdG8gdmVyaWZ5IHRoZSBlbmNvZGVyJ3Mgc2FtcGxlLXJhdGVzLlxyXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBidWZmZXJTaXplIC0gQnVmZmVyLXNpemUgdXNlZCB0byBlbmNvZGUgdGhlIFdBViBjb250YWluZXJcclxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXHJcbiAgICAgICAgICogQGluc3RhbmNlXHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAqICAgICBhbGVydCgnUmVjb3JkZXIgdXNlZCB0aGlzIGJ1ZmZlci1zaXplOiAnICsgdGhpcy5idWZmZXJTaXplKTtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKi9cclxuICAgICAgICBidWZmZXJTaXplOiAwLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIHdvcmtzIG9ubHkgd2l0aCB7cmVjb3JkZXJUeXBlOlN0ZXJlb0F1ZGlvUmVjb3JkZXJ9LiBVc2UgdGhpcyBwcm9wZXJ0eSBvbiBcInN0b3BSZWNvcmRpbmdcIiB0byB2ZXJpZnkgdGhlIGVuY29kZXIncyBzYW1wbGUtcmF0ZXMuXHJcbiAgICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IHNhbXBsZVJhdGUgLSBTYW1wbGUtcmF0ZXMgdXNlZCB0byBlbmNvZGUgdGhlIFdBViBjb250YWluZXJcclxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXHJcbiAgICAgICAgICogQGluc3RhbmNlXHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAqICAgICBhbGVydCgnUmVjb3JkZXIgdXNlZCB0aGVzZSBzYW1wbGUtcmF0ZXM6ICcgKyB0aGlzLnNhbXBsZVJhdGUpO1xyXG4gICAgICAgICAqIH0pO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNhbXBsZVJhdGU6IDAsXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIHtyZWNvcmRlclR5cGU6U3RlcmVvQXVkaW9SZWNvcmRlcn0gcmV0dXJucyBBcnJheUJ1ZmZlciBvYmplY3QuXHJcbiAgICAgICAgICogQHByb3BlcnR5IHtBcnJheUJ1ZmZlcn0gYnVmZmVyIC0gQXVkaW8gQXJyYXlCdWZmZXIsIHN1cHBvcnRlZCBvbmx5IGluIENocm9tZS5cclxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXHJcbiAgICAgICAgICogQGluc3RhbmNlXHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAqICAgICB2YXIgYXJyYXlCdWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICAgICAgICAgKiAgICAgYWxlcnQoYXJyYXlCdWZmZXIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICogfSk7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgYnVmZmVyOiBudWxsLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIG1ldGhvZCByZXNldHMgdGhlIHJlY29yZGVyLiBTbyB0aGF0IHlvdSBjYW4gcmV1c2Ugc2luZ2xlIHJlY29yZGVyIGluc3RhbmNlIG1hbnkgdGltZXMuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHJlY29yZGVyLnJlc2V0KCk7XHJcbiAgICAgICAgICogcmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKTtcclxuICAgICAgICAgKi9cclxuICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxmLnN0YXRlID09PSAncmVjb3JkaW5nJyAmJiAhY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1N0b3AgYW4gYWN0aXZlIHJlY29yZGVyLicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWVkaWFSZWNvcmRlciAmJiB0eXBlb2YgbWVkaWFSZWNvcmRlci5jbGVhclJlY29yZGVkRGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5jbGVhclJlY29yZGVkRGF0YSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1lZGlhUmVjb3JkZXIgPSBudWxsO1xyXG4gICAgICAgICAgICBzZXRTdGF0ZSgnaW5hY3RpdmUnKTtcclxuICAgICAgICAgICAgc2VsZi5ibG9iID0gbnVsbDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbmV2ZXIgcmVjb3JkZXIncyBzdGF0ZSBjaGFuZ2VzLiBVc2UgdGhpcyBhcyBhbiBcImV2ZW50XCIuXHJcbiAgICAgICAgICogQHByb3BlcnR5IHtTdHJpbmd9IHN0YXRlIC0gQSByZWNvcmRlcidzIHN0YXRlIGNhbiBiZTogcmVjb3JkaW5nLCBwYXVzZWQsIHN0b3BwZWQgb3IgaW5hY3RpdmUuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHJlY29yZGVyLm9uU3RhdGVDaGFuZ2VkID0gZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ1JlY29yZGVyIHN0YXRlOiAnLCBzdGF0ZSk7XHJcbiAgICAgICAgICogfTtcclxuICAgICAgICAgKi9cclxuICAgICAgICBvblN0YXRlQ2hhbmdlZDogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWNvcmRlciBzdGF0ZSBjaGFuZ2VkOicsIHN0YXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgcmVjb3JkZXIgY2FuIGhhdmUgaW5hY3RpdmUsIHJlY29yZGluZywgcGF1c2VkIG9yIHN0b3BwZWQgc3RhdGVzLlxyXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBzdGF0ZSAtIEEgcmVjb3JkZXIncyBzdGF0ZSBjYW4gYmU6IHJlY29yZGluZywgcGF1c2VkLCBzdG9wcGVkIG9yIGluYWN0aXZlLlxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAc3RhdGljXHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiAvLyB0aGlzIGxvb3BlciBmdW5jdGlvbiB3aWxsIGtlZXAgeW91IHVwZGF0ZWQgYWJvdXQgdGhlIHJlY29yZGVyJ3Mgc3RhdGVzLlxyXG4gICAgICAgICAqIChmdW5jdGlvbiBsb29wZXIoKSB7XHJcbiAgICAgICAgICogICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2gxJykuaW5uZXJIVE1MID0gJ1JlY29yZGVyXFwncyBzdGF0ZSBpczogJyArIHJlY29yZGVyLnN0YXRlO1xyXG4gICAgICAgICAqICAgICBpZihyZWNvcmRlci5zdGF0ZSA9PT0gJ3N0b3BwZWQnKSByZXR1cm47IC8vIGlnbm9yZStzdG9wXHJcbiAgICAgICAgICogICAgIHNldFRpbWVvdXQobG9vcGVyLCAxMDAwKTsgLy8gdXBkYXRlIGFmdGVyIGV2ZXJ5IDMtc2Vjb25kc1xyXG4gICAgICAgICAqIH0pKCk7XHJcbiAgICAgICAgICogcmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKTtcclxuICAgICAgICAgKi9cclxuICAgICAgICBzdGF0ZTogJ2luYWN0aXZlJyxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR2V0IHJlY29yZGVyJ3MgcmVhZG9ubHkgc3RhdGUuXHJcbiAgICAgICAgICogQG1ldGhvZFxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHZhciBzdGF0ZSA9IHJlY29yZGVyLmdldFN0YXRlKCk7XHJcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ30gUmV0dXJucyByZWNvcmRpbmcgc3RhdGUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2VsZi5zdGF0ZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZXN0cm95IFJlY29yZFJUQyBpbnN0YW5jZS4gQ2xlYXIgYWxsIHJlY29yZGVycyBhbmQgb2JqZWN0cy5cclxuICAgICAgICAgKiBAbWV0aG9kXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogcmVjb3JkZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgZGlzYWJsZUxvZ3NDYWNoZSA9IGNvbmZpZy5kaXNhYmxlTG9ncztcclxuXHJcbiAgICAgICAgICAgIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgICAgIGRpc2FibGVMb2dzOiB0cnVlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHNlbGYucmVzZXQoKTtcclxuICAgICAgICAgICAgc2V0U3RhdGUoJ2Rlc3Ryb3llZCcpO1xyXG4gICAgICAgICAgICByZXR1cm5PYmplY3QgPSBzZWxmID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChTdG9yYWdlLkF1ZGlvQ29udGV4dENvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBTdG9yYWdlLkF1ZGlvQ29udGV4dENvbnN0cnVjdG9yLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBTdG9yYWdlLkF1ZGlvQ29udGV4dENvbnN0cnVjdG9yID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uZmlnLmRpc2FibGVMb2dzID0gZGlzYWJsZUxvZ3NDYWNoZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjb3JkUlRDIGlzIGRlc3Ryb3llZC4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJlY29yZFJUQyB2ZXJzaW9uIG51bWJlclxyXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSB2ZXJzaW9uIC0gUmVsZWFzZSB2ZXJzaW9uIG51bWJlci5cclxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXHJcbiAgICAgICAgICogQHN0YXRpY1xyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogYWxlcnQocmVjb3JkZXIudmVyc2lvbik7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmVyc2lvbjogJzUuNi4yJ1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoIXRoaXMpIHtcclxuICAgICAgICBzZWxmID0gcmV0dXJuT2JqZWN0O1xyXG4gICAgICAgIHJldHVybiByZXR1cm5PYmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgc29tZW9uZSB3YW50cyB0byB1c2UgUmVjb3JkUlRDIHdpdGggdGhlIFwibmV3XCIga2V5d29yZC5cclxuICAgIGZvciAodmFyIHByb3AgaW4gcmV0dXJuT2JqZWN0KSB7XHJcbiAgICAgICAgdGhpc1twcm9wXSA9IHJldHVybk9iamVjdFtwcm9wXTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICByZXR1cm4gcmV0dXJuT2JqZWN0O1xyXG59XHJcblxyXG5SZWNvcmRSVEMudmVyc2lvbiA9ICc1LjYuMic7XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgLyogJiYgISFtb2R1bGUuZXhwb3J0cyovICkge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBSZWNvcmRSVEM7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZSgnUmVjb3JkUlRDJywgW10sIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBSZWNvcmRSVEM7XHJcbiAgICB9KTtcclxufVxuXHJcblJlY29yZFJUQy5nZXRGcm9tRGlzayA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAoIWNhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhyb3cgJ2NhbGxiYWNrIGlzIG1hbmRhdG9yeS4nO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nIHJlY29yZGVkICcgKyAodHlwZSA9PT0gJ2FsbCcgPyAnYmxvYnMnIDogdHlwZSArICcgYmxvYiAnKSArICcgZnJvbSBkaXNrIScpO1xyXG4gICAgRGlza1N0b3JhZ2UuRmV0Y2goZnVuY3Rpb24oZGF0YVVSTCwgX3R5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSAhPT0gJ2FsbCcgJiYgX3R5cGUgPT09IHR5cGUgKyAnQmxvYicgJiYgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soZGF0YVVSTCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZSA9PT0gJ2FsbCcgJiYgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soZGF0YVVSTCwgX3R5cGUucmVwbGFjZSgnQmxvYicsICcnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gc3RvcmUgcmVjb3JkZWQgYmxvYnMgaW50byBJbmRleGVkREIgc3RvcmFnZS5cclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgLSB7YXVkaW86IEJsb2IsIHZpZGVvOiBCbG9iLCBnaWY6IEJsb2J9XHJcbiAqIEBtZXRob2RcclxuICogQG1lbWJlcm9mIFJlY29yZFJUQ1xyXG4gKiBAZXhhbXBsZVxyXG4gKiBSZWNvcmRSVEMud3JpdGVUb0Rpc2soe1xyXG4gKiAgICAgYXVkaW86IGF1ZGlvQmxvYixcclxuICogICAgIHZpZGVvOiB2aWRlb0Jsb2IsXHJcbiAqICAgICBnaWYgIDogZ2lmQmxvYlxyXG4gKiB9KTtcclxuICovXHJcblJlY29yZFJUQy53cml0ZVRvRGlzayA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgIGNvbnNvbGUubG9nKCdXcml0aW5nIHJlY29yZGVkIGJsb2IocykgdG8gZGlzayEnKTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgaWYgKG9wdGlvbnMuYXVkaW8gJiYgb3B0aW9ucy52aWRlbyAmJiBvcHRpb25zLmdpZikge1xyXG4gICAgICAgIG9wdGlvbnMuYXVkaW8uZ2V0RGF0YVVSTChmdW5jdGlvbihhdWRpb0RhdGFVUkwpIHtcclxuICAgICAgICAgICAgb3B0aW9ucy52aWRlby5nZXREYXRhVVJMKGZ1bmN0aW9uKHZpZGVvRGF0YVVSTCkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5naWYuZ2V0RGF0YVVSTChmdW5jdGlvbihnaWZEYXRhVVJMKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgRGlza1N0b3JhZ2UuU3RvcmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdWRpb0Jsb2I6IGF1ZGlvRGF0YVVSTCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9CbG9iOiB2aWRlb0RhdGFVUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdpZkJsb2I6IGdpZkRhdGFVUkxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5hdWRpbyAmJiBvcHRpb25zLnZpZGVvKSB7XHJcbiAgICAgICAgb3B0aW9ucy5hdWRpby5nZXREYXRhVVJMKGZ1bmN0aW9uKGF1ZGlvRGF0YVVSTCkge1xyXG4gICAgICAgICAgICBvcHRpb25zLnZpZGVvLmdldERhdGFVUkwoZnVuY3Rpb24odmlkZW9EYXRhVVJMKSB7XHJcbiAgICAgICAgICAgICAgICBEaXNrU3RvcmFnZS5TdG9yZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgYXVkaW9CbG9iOiBhdWRpb0RhdGFVUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9CbG9iOiB2aWRlb0RhdGFVUkxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5hdWRpbyAmJiBvcHRpb25zLmdpZikge1xyXG4gICAgICAgIG9wdGlvbnMuYXVkaW8uZ2V0RGF0YVVSTChmdW5jdGlvbihhdWRpb0RhdGFVUkwpIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5naWYuZ2V0RGF0YVVSTChmdW5jdGlvbihnaWZEYXRhVVJMKSB7XHJcbiAgICAgICAgICAgICAgICBEaXNrU3RvcmFnZS5TdG9yZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgYXVkaW9CbG9iOiBhdWRpb0RhdGFVUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgZ2lmQmxvYjogZ2lmRGF0YVVSTFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChvcHRpb25zLnZpZGVvICYmIG9wdGlvbnMuZ2lmKSB7XHJcbiAgICAgICAgb3B0aW9ucy52aWRlby5nZXREYXRhVVJMKGZ1bmN0aW9uKHZpZGVvRGF0YVVSTCkge1xyXG4gICAgICAgICAgICBvcHRpb25zLmdpZi5nZXREYXRhVVJMKGZ1bmN0aW9uKGdpZkRhdGFVUkwpIHtcclxuICAgICAgICAgICAgICAgIERpc2tTdG9yYWdlLlN0b3JlKHtcclxuICAgICAgICAgICAgICAgICAgICB2aWRlb0Jsb2I6IHZpZGVvRGF0YVVSTCxcclxuICAgICAgICAgICAgICAgICAgICBnaWZCbG9iOiBnaWZEYXRhVVJMXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuYXVkaW8pIHtcclxuICAgICAgICBvcHRpb25zLmF1ZGlvLmdldERhdGFVUkwoZnVuY3Rpb24oYXVkaW9EYXRhVVJMKSB7XHJcbiAgICAgICAgICAgIERpc2tTdG9yYWdlLlN0b3JlKHtcclxuICAgICAgICAgICAgICAgIGF1ZGlvQmxvYjogYXVkaW9EYXRhVVJMXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChvcHRpb25zLnZpZGVvKSB7XHJcbiAgICAgICAgb3B0aW9ucy52aWRlby5nZXREYXRhVVJMKGZ1bmN0aW9uKHZpZGVvRGF0YVVSTCkge1xyXG4gICAgICAgICAgICBEaXNrU3RvcmFnZS5TdG9yZSh7XHJcbiAgICAgICAgICAgICAgICB2aWRlb0Jsb2I6IHZpZGVvRGF0YVVSTFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5naWYpIHtcclxuICAgICAgICBvcHRpb25zLmdpZi5nZXREYXRhVVJMKGZ1bmN0aW9uKGdpZkRhdGFVUkwpIHtcclxuICAgICAgICAgICAgRGlza1N0b3JhZ2UuU3RvcmUoe1xyXG4gICAgICAgICAgICAgICAgZ2lmQmxvYjogZ2lmRGF0YVVSTFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcblxyXG4vLyBfX19fX19fX19fX19fX19fX19fX19fX19fX1xyXG4vLyBSZWNvcmRSVEMtQ29uZmlndXJhdGlvbi5qc1xyXG5cclxuLyoqXHJcbiAqIHtAbGluayBSZWNvcmRSVENDb25maWd1cmF0aW9ufSBpcyBhbiBpbm5lci9wcml2YXRlIGhlbHBlciBmb3Ige0BsaW5rIFJlY29yZFJUQ30uXHJcbiAqIEBzdW1tYXJ5IEl0IGNvbmZpZ3VyZXMgdGhlIDJuZCBwYXJhbWV0ZXIgcGFzc2VkIG92ZXIge0BsaW5rIFJlY29yZFJUQ30gYW5kIHJldHVybnMgYSB2YWxpZCBcImNvbmZpZ1wiIG9iamVjdC5cclxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL0xJQ0VOU0V8TUlUfVxyXG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL011YXpLaGFuLmNvbXxNdWF6IEtoYW59XHJcbiAqIEB0eXBlZGVmIFJlY29yZFJUQ0NvbmZpZ3VyYXRpb25cclxuICogQGNsYXNzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBvcHRpb25zID0gUmVjb3JkUlRDQ29uZmlndXJhdGlvbihtZWRpYVN0cmVhbSwgb3B0aW9ucyk7XHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBNZWRpYVN0cmVhbSBvYmplY3QgZmV0Y2hlZCB1c2luZyBnZXRVc2VyTWVkaWEgQVBJIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgLSB7dHlwZTpcInZpZGVvXCIsIGRpc2FibGVMb2dzOiB0cnVlLCBudW1iZXJPZkF1ZGlvQ2hhbm5lbHM6IDEsIGJ1ZmZlclNpemU6IDAsIHNhbXBsZVJhdGU6IDAsIHZpZGVvOiBIVE1MVmlkZW9FbGVtZW50LCBnZXROYXRpdmVCbG9iOnRydWUsIGV0Yy59XHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gUmVjb3JkUlRDQ29uZmlndXJhdGlvbihtZWRpYVN0cmVhbSwgY29uZmlnKSB7XHJcbiAgICBpZiAoIWNvbmZpZy5yZWNvcmRlclR5cGUgJiYgIWNvbmZpZy50eXBlKSB7XHJcbiAgICAgICAgaWYgKCEhY29uZmlnLmF1ZGlvICYmICEhY29uZmlnLnZpZGVvKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy50eXBlID0gJ3ZpZGVvJztcclxuICAgICAgICB9IGVsc2UgaWYgKCEhY29uZmlnLmF1ZGlvICYmICFjb25maWcudmlkZW8pIHtcclxuICAgICAgICAgICAgY29uZmlnLnR5cGUgPSAnYXVkaW8nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlnLnJlY29yZGVyVHlwZSAmJiAhY29uZmlnLnR5cGUpIHtcclxuICAgICAgICBpZiAoY29uZmlnLnJlY29yZGVyVHlwZSA9PT0gV2hhbW15UmVjb3JkZXIgfHwgY29uZmlnLnJlY29yZGVyVHlwZSA9PT0gQ2FudmFzUmVjb3JkZXIgfHwgKHR5cGVvZiBXZWJBc3NlbWJseVJlY29yZGVyICE9PSAndW5kZWZpbmVkJyAmJiBjb25maWcucmVjb3JkZXJUeXBlID09PSBXZWJBc3NlbWJseVJlY29yZGVyKSkge1xyXG4gICAgICAgICAgICBjb25maWcudHlwZSA9ICd2aWRlbyc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb25maWcucmVjb3JkZXJUeXBlID09PSBHaWZSZWNvcmRlcikge1xyXG4gICAgICAgICAgICBjb25maWcudHlwZSA9ICdnaWYnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnJlY29yZGVyVHlwZSA9PT0gU3RlcmVvQXVkaW9SZWNvcmRlcikge1xyXG4gICAgICAgICAgICBjb25maWcudHlwZSA9ICdhdWRpbyc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb25maWcucmVjb3JkZXJUeXBlID09PSBNZWRpYVN0cmVhbVJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIGlmIChnZXRUcmFja3MobWVkaWFTdHJlYW0sICdhdWRpbycpLmxlbmd0aCAmJiBnZXRUcmFja3MobWVkaWFTdHJlYW0sICd2aWRlbycpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLnR5cGUgPSAndmlkZW8nO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFnZXRUcmFja3MobWVkaWFTdHJlYW0sICdhdWRpbycpLmxlbmd0aCAmJiBnZXRUcmFja3MobWVkaWFTdHJlYW0sICd2aWRlbycpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLnR5cGUgPSAndmlkZW8nO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdldFRyYWNrcyhtZWRpYVN0cmVhbSwgJ2F1ZGlvJykubGVuZ3RoICYmICFnZXRUcmFja3MobWVkaWFTdHJlYW0sICd2aWRlbycpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLnR5cGUgPSAnYXVkaW8nO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gY29uZmlnLnR5cGUgPSAnVW5Lbm93bic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBNZWRpYVN0cmVhbVJlY29yZGVyICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgTWVkaWFSZWNvcmRlciAhPT0gJ3VuZGVmaW5lZCcgJiYgJ3JlcXVlc3REYXRhJyBpbiBNZWRpYVJlY29yZGVyLnByb3RvdHlwZSkge1xyXG4gICAgICAgIGlmICghY29uZmlnLm1pbWVUeXBlKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5taW1lVHlwZSA9ICd2aWRlby93ZWJtJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY29uZmlnLnR5cGUpIHtcclxuICAgICAgICAgICAgY29uZmlnLnR5cGUgPSBjb25maWcubWltZVR5cGUuc3BsaXQoJy8nKVswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY29uZmlnLmJpdHNQZXJTZWNvbmQpIHtcclxuICAgICAgICAgICAgLy8gY29uZmlnLmJpdHNQZXJTZWNvbmQgPSAxMjgwMDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnNpZGVyIGRlZmF1bHQgdHlwZT1hdWRpb1xyXG4gICAgaWYgKCFjb25maWcudHlwZSkge1xyXG4gICAgICAgIGlmIChjb25maWcubWltZVR5cGUpIHtcclxuICAgICAgICAgICAgY29uZmlnLnR5cGUgPSBjb25maWcubWltZVR5cGUuc3BsaXQoJy8nKVswXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFjb25maWcudHlwZSkge1xyXG4gICAgICAgICAgICBjb25maWcudHlwZSA9ICdhdWRpbyc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb25maWc7XHJcbn1cblxyXG4vLyBfX19fX19fX19fX19fX19fX19cclxuLy8gR2V0UmVjb3JkZXJUeXBlLmpzXHJcblxyXG4vKipcclxuICoge0BsaW5rIEdldFJlY29yZGVyVHlwZX0gaXMgYW4gaW5uZXIvcHJpdmF0ZSBoZWxwZXIgZm9yIHtAbGluayBSZWNvcmRSVEN9LlxyXG4gKiBAc3VtbWFyeSBJdCByZXR1cm5zIGJlc3QgcmVjb3JkZXItdHlwZSBhdmFpbGFibGUgZm9yIHlvdXIgYnJvd3Nlci5cclxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL0xJQ0VOU0V8TUlUfVxyXG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL011YXpLaGFuLmNvbXxNdWF6IEtoYW59XHJcbiAqIEB0eXBlZGVmIEdldFJlY29yZGVyVHlwZVxyXG4gKiBAY2xhc3NcclxuICogQGV4YW1wbGVcclxuICogdmFyIFJlY29yZGVyVHlwZSA9IEdldFJlY29yZGVyVHlwZShvcHRpb25zKTtcclxuICogdmFyIHJlY29yZGVyID0gbmV3IFJlY29yZGVyVHlwZShvcHRpb25zKTtcclxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEN8UmVjb3JkUlRDIFNvdXJjZSBDb2RlfVxyXG4gKiBAcGFyYW0ge01lZGlhU3RyZWFtfSBtZWRpYVN0cmVhbSAtIE1lZGlhU3RyZWFtIG9iamVjdCBmZXRjaGVkIHVzaW5nIGdldFVzZXJNZWRpYSBBUEkgb3IgZ2VuZXJhdGVkIHVzaW5nIGNhcHR1cmVTdHJlYW1VbnRpbEVuZGVkIG9yIFdlYkF1ZGlvIEFQSS5cclxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyAtIHt0eXBlOlwidmlkZW9cIiwgZGlzYWJsZUxvZ3M6IHRydWUsIG51bWJlck9mQXVkaW9DaGFubmVsczogMSwgYnVmZmVyU2l6ZTogMCwgc2FtcGxlUmF0ZTogMCwgdmlkZW86IEhUTUxWaWRlb0VsZW1lbnQsIGV0Yy59XHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gR2V0UmVjb3JkZXJUeXBlKG1lZGlhU3RyZWFtLCBjb25maWcpIHtcclxuICAgIHZhciByZWNvcmRlcjtcclxuXHJcbiAgICAvLyBTdGVyZW9BdWRpb1JlY29yZGVyIGNhbiB3b3JrIHdpdGggYWxsIHRocmVlOiBFZGdlLCBGaXJlZm94IGFuZCBDaHJvbWVcclxuICAgIC8vIHRvZG86IGRldGVjdCBpZiBpdCBpcyBFZGdlLCB0aGVuIGF1dG8gdXNlOiBTdGVyZW9BdWRpb1JlY29yZGVyXHJcbiAgICBpZiAoaXNDaHJvbWUgfHwgaXNFZGdlIHx8IGlzT3BlcmEpIHtcclxuICAgICAgICAvLyBNZWRpYSBTdHJlYW0gUmVjb3JkaW5nIEFQSSBoYXMgbm90IGJlZW4gaW1wbGVtZW50ZWQgaW4gY2hyb21lIHlldDtcclxuICAgICAgICAvLyBUaGF0J3Mgd2h5IHVzaW5nIFdlYkF1ZGlvIEFQSSB0byByZWNvcmQgc3RlcmVvIGF1ZGlvIGluIFdBViBmb3JtYXRcclxuICAgICAgICByZWNvcmRlciA9IFN0ZXJlb0F1ZGlvUmVjb3JkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBNZWRpYVJlY29yZGVyICE9PSAndW5kZWZpbmVkJyAmJiAncmVxdWVzdERhdGEnIGluIE1lZGlhUmVjb3JkZXIucHJvdG90eXBlICYmICFpc0Nocm9tZSkge1xyXG4gICAgICAgIHJlY29yZGVyID0gTWVkaWFTdHJlYW1SZWNvcmRlcjtcclxuICAgIH1cclxuXHJcbiAgICAvLyB2aWRlbyByZWNvcmRlciAoaW4gV2ViTSBmb3JtYXQpXHJcbiAgICBpZiAoY29uZmlnLnR5cGUgPT09ICd2aWRlbycgJiYgKGlzQ2hyb21lIHx8IGlzT3BlcmEpKSB7XHJcbiAgICAgICAgcmVjb3JkZXIgPSBXaGFtbXlSZWNvcmRlcjtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBXZWJBc3NlbWJseVJlY29yZGVyICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgUmVhZGFibGVTdHJlYW0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHJlY29yZGVyID0gV2ViQXNzZW1ibHlSZWNvcmRlcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdmlkZW8gcmVjb3JkZXIgKGluIEdpZiBmb3JtYXQpXHJcbiAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdnaWYnKSB7XHJcbiAgICAgICAgcmVjb3JkZXIgPSBHaWZSZWNvcmRlcjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBodG1sMmNhbnZhcyByZWNvcmRpbmchXHJcbiAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdjYW52YXMnKSB7XHJcbiAgICAgICAgcmVjb3JkZXIgPSBDYW52YXNSZWNvcmRlcjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNNZWRpYVJlY29yZGVyQ29tcGF0aWJsZSgpICYmIHJlY29yZGVyICE9PSBDYW52YXNSZWNvcmRlciAmJiByZWNvcmRlciAhPT0gR2lmUmVjb3JkZXIgJiYgdHlwZW9mIE1lZGlhUmVjb3JkZXIgIT09ICd1bmRlZmluZWQnICYmICdyZXF1ZXN0RGF0YScgaW4gTWVkaWFSZWNvcmRlci5wcm90b3R5cGUpIHtcclxuICAgICAgICBpZiAoZ2V0VHJhY2tzKG1lZGlhU3RyZWFtLCAndmlkZW8nKS5sZW5ndGggfHwgZ2V0VHJhY2tzKG1lZGlhU3RyZWFtLCAnYXVkaW8nKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgLy8gYXVkaW8tb25seSByZWNvcmRpbmdcclxuICAgICAgICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAnYXVkaW8nKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIE1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkID09PSAnZnVuY3Rpb24nICYmIE1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkKCdhdWRpby93ZWJtJykpIHtcclxuICAgICAgICAgICAgICAgICAgICByZWNvcmRlciA9IE1lZGlhU3RyZWFtUmVjb3JkZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBlbHNlIHJlY29yZGVyID0gU3RlcmVvQXVkaW9SZWNvcmRlcjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHZpZGVvIG9yIHNjcmVlbiB0cmFja3NcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQgPT09ICdmdW5jdGlvbicgJiYgTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQoJ3ZpZGVvL3dlYm0nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlY29yZGVyID0gTWVkaWFTdHJlYW1SZWNvcmRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAobWVkaWFTdHJlYW0gaW5zdGFuY2VvZiBBcnJheSAmJiBtZWRpYVN0cmVhbS5sZW5ndGgpIHtcclxuICAgICAgICByZWNvcmRlciA9IE11bHRpU3RyZWFtUmVjb3JkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbmZpZy5yZWNvcmRlclR5cGUpIHtcclxuICAgICAgICByZWNvcmRlciA9IGNvbmZpZy5yZWNvcmRlclR5cGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MgJiYgISFyZWNvcmRlciAmJiAhIXJlY29yZGVyLm5hbWUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgcmVjb3JkZXJUeXBlOicsIHJlY29yZGVyLm5hbWUgfHwgcmVjb3JkZXIuY29uc3RydWN0b3IubmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFyZWNvcmRlciAmJiBpc1NhZmFyaSkge1xyXG4gICAgICAgIHJlY29yZGVyID0gTWVkaWFTdHJlYW1SZWNvcmRlcjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVjb3JkZXI7XHJcbn1cblxyXG4vLyBfX19fX19fX19fX19fXHJcbi8vIE1SZWNvcmRSVEMuanNcclxuXHJcbi8qKlxyXG4gKiBNUmVjb3JkUlRDIHJ1bnMgb24gdG9wIG9mIHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIG11bHRpcGxlIHJlY29yZGluZ3MgaW4gYSBzaW5nbGUgcGxhY2UsIGJ5IHByb3ZpZGluZyBzaW1wbGUgQVBJLlxyXG4gKiBAc3VtbWFyeSBNUmVjb3JkUlRDIHN0YW5kcyBmb3IgXCJNdWx0aXBsZS1SZWNvcmRSVENcIi5cclxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL0xJQ0VOU0V8TUlUfVxyXG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL011YXpLaGFuLmNvbXxNdWF6IEtoYW59XHJcbiAqIEB0eXBlZGVmIE1SZWNvcmRSVENcclxuICogQGNsYXNzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciByZWNvcmRlciA9IG5ldyBNUmVjb3JkUlRDKCk7XHJcbiAqIHJlY29yZGVyLmFkZFN0cmVhbShNZWRpYVN0cmVhbSk7XHJcbiAqIHJlY29yZGVyLm1lZGlhVHlwZSA9IHtcclxuICogICAgIGF1ZGlvOiB0cnVlLCAvLyBvciBTdGVyZW9BdWRpb1JlY29yZGVyIG9yIE1lZGlhU3RyZWFtUmVjb3JkZXJcclxuICogICAgIHZpZGVvOiB0cnVlLCAvLyBvciBXaGFtbXlSZWNvcmRlciBvciBNZWRpYVN0cmVhbVJlY29yZGVyIG9yIFdlYkFzc2VtYmx5UmVjb3JkZXIgb3IgQ2FudmFzUmVjb3JkZXJcclxuICogICAgIGdpZjogdHJ1ZSAgICAvLyBvciBHaWZSZWNvcmRlclxyXG4gKiB9O1xyXG4gKiAvLyBtaW1lVHlwZSBpcyBvcHRpb25hbCBhbmQgc2hvdWxkIGJlIHNldCBvbmx5IGluIGFkdmFuY2UgY2FzZXMuXHJcbiAqIHJlY29yZGVyLm1pbWVUeXBlID0ge1xyXG4gKiAgICAgYXVkaW86ICdhdWRpby93YXYnLFxyXG4gKiAgICAgdmlkZW86ICd2aWRlby93ZWJtJyxcclxuICogICAgIGdpZjogICAnaW1hZ2UvZ2lmJ1xyXG4gKiB9O1xyXG4gKiByZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xyXG4gKiBAc2VlIEZvciBmdXJ0aGVyIGluZm9ybWF0aW9uOlxyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQy90cmVlL21hc3Rlci9NUmVjb3JkUlRDfE1SZWNvcmRSVEMgU291cmNlIENvZGV9XHJcbiAqIEBwYXJhbSB7TWVkaWFTdHJlYW19IG1lZGlhU3RyZWFtIC0gTWVkaWFTdHJlYW0gb2JqZWN0IGZldGNoZWQgdXNpbmcgZ2V0VXNlck1lZGlhIEFQSSBvciBnZW5lcmF0ZWQgdXNpbmcgY2FwdHVyZVN0cmVhbVVudGlsRW5kZWQgb3IgV2ViQXVkaW8gQVBJLlxyXG4gKiBAcmVxdWlyZXMge0BsaW5rIFJlY29yZFJUQ31cclxuICovXHJcblxyXG5mdW5jdGlvbiBNUmVjb3JkUlRDKG1lZGlhU3RyZWFtKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBhdHRhY2hlcyBNZWRpYVN0cmVhbSBvYmplY3QgdG8ge0BsaW5rIE1SZWNvcmRSVEN9LlxyXG4gICAgICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBBIE1lZGlhU3RyZWFtIG9iamVjdCwgZWl0aGVyIGZldGNoZWQgdXNpbmcgZ2V0VXNlck1lZGlhIEFQSSwgb3IgZ2VuZXJhdGVkIHVzaW5nIGNhcHR1cmVTdHJlYW1VbnRpbEVuZGVkIG9yIFdlYkF1ZGlvIEFQSS5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIuYWRkU3RyZWFtKE1lZGlhU3RyZWFtKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5hZGRTdHJlYW0gPSBmdW5jdGlvbihfbWVkaWFTdHJlYW0pIHtcclxuICAgICAgICBpZiAoX21lZGlhU3RyZWFtKSB7XHJcbiAgICAgICAgICAgIG1lZGlhU3RyZWFtID0gX21lZGlhU3RyZWFtO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIHNldCB0aGUgcmVjb3JkaW5nIHR5cGUgZS5nLiBhdWRpbywgb3IgdmlkZW8sIG9yIGdpZiwgb3IgY2FudmFzLlxyXG4gICAgICogQHByb3BlcnR5IHtvYmplY3R9IG1lZGlhVHlwZSAtIHthdWRpbzogdHJ1ZSwgdmlkZW86IHRydWUsIGdpZjogdHJ1ZX1cclxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdmFyIHJlY29yZGVyID0gbmV3IE1SZWNvcmRSVEMoKTtcclxuICAgICAqIHJlY29yZGVyLm1lZGlhVHlwZSA9IHtcclxuICAgICAqICAgICBhdWRpbzogdHJ1ZSwgLy8gVFJVRSBvciBTdGVyZW9BdWRpb1JlY29yZGVyIG9yIE1lZGlhU3RyZWFtUmVjb3JkZXJcclxuICAgICAqICAgICB2aWRlbzogdHJ1ZSwgLy8gVFJVRSBvciBXaGFtbXlSZWNvcmRlciBvciBNZWRpYVN0cmVhbVJlY29yZGVyIG9yIFdlYkFzc2VtYmx5UmVjb3JkZXIgb3IgQ2FudmFzUmVjb3JkZXJcclxuICAgICAqICAgICBnaWYgIDogdHJ1ZSAgLy8gVFJVRSBvciBHaWZSZWNvcmRlclxyXG4gICAgICogfTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5tZWRpYVR5cGUgPSB7XHJcbiAgICAgICAgYXVkaW86IHRydWUsXHJcbiAgICAgICAgdmlkZW86IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBzdGFydHMgcmVjb3JkaW5nLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1SZWNvcmRSVENcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnN0YXJ0UmVjb3JkaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG1lZGlhVHlwZSA9IHRoaXMubWVkaWFUeXBlO1xyXG4gICAgICAgIHZhciByZWNvcmRlclR5cGU7XHJcbiAgICAgICAgdmFyIG1pbWVUeXBlID0gdGhpcy5taW1lVHlwZSB8fCB7XHJcbiAgICAgICAgICAgIGF1ZGlvOiBudWxsLFxyXG4gICAgICAgICAgICB2aWRlbzogbnVsbCxcclxuICAgICAgICAgICAgZ2lmOiBudWxsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZWRpYVR5cGUuYXVkaW8gIT09ICdmdW5jdGlvbicgJiYgaXNNZWRpYVJlY29yZGVyQ29tcGF0aWJsZSgpICYmICFnZXRUcmFja3MobWVkaWFTdHJlYW0sICdhdWRpbycpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBtZWRpYVR5cGUuYXVkaW8gPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbWVkaWFUeXBlLnZpZGVvICE9PSAnZnVuY3Rpb24nICYmIGlzTWVkaWFSZWNvcmRlckNvbXBhdGlibGUoKSAmJiAhZ2V0VHJhY2tzKG1lZGlhU3RyZWFtLCAndmlkZW8nKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbWVkaWFUeXBlLnZpZGVvID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG1lZGlhVHlwZS5naWYgIT09ICdmdW5jdGlvbicgJiYgaXNNZWRpYVJlY29yZGVyQ29tcGF0aWJsZSgpICYmICFnZXRUcmFja3MobWVkaWFTdHJlYW0sICd2aWRlbycpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBtZWRpYVR5cGUuZ2lmID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW1lZGlhVHlwZS5hdWRpbyAmJiAhbWVkaWFUeXBlLnZpZGVvICYmICFtZWRpYVR5cGUuZ2lmKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdNZWRpYVN0cmVhbSBtdXN0IGhhdmUgZWl0aGVyIGF1ZGlvIG9yIHZpZGVvIHRyYWNrcy4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEhbWVkaWFUeXBlLmF1ZGlvKSB7XHJcbiAgICAgICAgICAgIHJlY29yZGVyVHlwZSA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWVkaWFUeXBlLmF1ZGlvID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICByZWNvcmRlclR5cGUgPSBtZWRpYVR5cGUuYXVkaW87XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuYXVkaW9SZWNvcmRlciA9IG5ldyBSZWNvcmRSVEMobWVkaWFTdHJlYW0sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdhdWRpbycsXHJcbiAgICAgICAgICAgICAgICBidWZmZXJTaXplOiB0aGlzLmJ1ZmZlclNpemUsXHJcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlOiB0aGlzLnNhbXBsZVJhdGUsXHJcbiAgICAgICAgICAgICAgICBudW1iZXJPZkF1ZGlvQ2hhbm5lbHM6IHRoaXMubnVtYmVyT2ZBdWRpb0NoYW5uZWxzIHx8IDIsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlTG9nczogdGhpcy5kaXNhYmxlTG9ncyxcclxuICAgICAgICAgICAgICAgIHJlY29yZGVyVHlwZTogcmVjb3JkZXJUeXBlLFxyXG4gICAgICAgICAgICAgICAgbWltZVR5cGU6IG1pbWVUeXBlLmF1ZGlvLFxyXG4gICAgICAgICAgICAgICAgdGltZVNsaWNlOiB0aGlzLnRpbWVTbGljZSxcclxuICAgICAgICAgICAgICAgIG9uVGltZVN0YW1wOiB0aGlzLm9uVGltZVN0YW1wXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFtZWRpYVR5cGUudmlkZW8pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXVkaW9SZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISFtZWRpYVR5cGUudmlkZW8pIHtcclxuICAgICAgICAgICAgcmVjb3JkZXJUeXBlID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZWRpYVR5cGUudmlkZW8gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIHJlY29yZGVyVHlwZSA9IG1lZGlhVHlwZS52aWRlbztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5ld1N0cmVhbSA9IG1lZGlhU3RyZWFtO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzTWVkaWFSZWNvcmRlckNvbXBhdGlibGUoKSAmJiAhIW1lZGlhVHlwZS5hdWRpbyAmJiB0eXBlb2YgbWVkaWFUeXBlLmF1ZGlvID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlkZW9UcmFjayA9IGdldFRyYWNrcyhtZWRpYVN0cmVhbSwgJ3ZpZGVvJylbMF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzRmlyZWZveCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld1N0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld1N0cmVhbS5hZGRUcmFjayh2aWRlb1RyYWNrKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlY29yZGVyVHlwZSAmJiByZWNvcmRlclR5cGUgPT09IFdoYW1teVJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggZG9lcyBOT1Qgc3VwcG9ydHMgd2VicC1lbmNvZGluZyB5ZXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnV0IEZpcmVmb3ggZG8gc3VwcG9ydHMgV2ViQXNzZW1ibHlSZWNvcmRlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWNvcmRlclR5cGUgPSBNZWRpYVN0cmVhbVJlY29yZGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RyZWFtID0gbmV3IE1lZGlhU3RyZWFtKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RyZWFtLmFkZFRyYWNrKHZpZGVvVHJhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZpZGVvUmVjb3JkZXIgPSBuZXcgUmVjb3JkUlRDKG5ld1N0cmVhbSwge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3ZpZGVvJyxcclxuICAgICAgICAgICAgICAgIHZpZGVvOiB0aGlzLnZpZGVvLFxyXG4gICAgICAgICAgICAgICAgY2FudmFzOiB0aGlzLmNhbnZhcyxcclxuICAgICAgICAgICAgICAgIGZyYW1lSW50ZXJ2YWw6IHRoaXMuZnJhbWVJbnRlcnZhbCB8fCAxMCxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVMb2dzOiB0aGlzLmRpc2FibGVMb2dzLFxyXG4gICAgICAgICAgICAgICAgcmVjb3JkZXJUeXBlOiByZWNvcmRlclR5cGUsXHJcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogbWltZVR5cGUudmlkZW8sXHJcbiAgICAgICAgICAgICAgICB0aW1lU2xpY2U6IHRoaXMudGltZVNsaWNlLFxyXG4gICAgICAgICAgICAgICAgb25UaW1lU3RhbXA6IHRoaXMub25UaW1lU3RhbXAsXHJcbiAgICAgICAgICAgICAgICB3b3JrZXJQYXRoOiB0aGlzLndvcmtlclBhdGgsXHJcbiAgICAgICAgICAgICAgICB3ZWJBc3NlbWJseVBhdGg6IHRoaXMud2ViQXNzZW1ibHlQYXRoLFxyXG4gICAgICAgICAgICAgICAgZnJhbWVSYXRlOiB0aGlzLmZyYW1lUmF0ZSwgLy8gdXNlZCBieSBXZWJBc3NlbWJseVJlY29yZGVyOyB2YWx1ZXM6IHVzdWFsbHkgMzA7IGFjY2VwdHMgYW55LlxyXG4gICAgICAgICAgICAgICAgYml0cmF0ZTogdGhpcy5iaXRyYXRlIC8vIHVzZWQgYnkgV2ViQXNzZW1ibHlSZWNvcmRlcjsgdmFsdWVzOiAwIHRvIDEwMDArXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFtZWRpYVR5cGUuYXVkaW8pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlkZW9SZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISFtZWRpYVR5cGUuYXVkaW8gJiYgISFtZWRpYVR5cGUudmlkZW8pIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdmFyIGlzU2luZ2xlUmVjb3JkZXIgPSBpc01lZGlhUmVjb3JkZXJDb21wYXRpYmxlKCkgPT09IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAobWVkaWFUeXBlLmF1ZGlvIGluc3RhbmNlb2YgU3RlcmVvQXVkaW9SZWNvcmRlciAmJiAhIW1lZGlhVHlwZS52aWRlbykge1xyXG4gICAgICAgICAgICAgICAgaXNTaW5nbGVSZWNvcmRlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lZGlhVHlwZS5hdWRpbyAhPT0gdHJ1ZSAmJiBtZWRpYVR5cGUudmlkZW8gIT09IHRydWUgJiYgbWVkaWFUeXBlLmF1ZGlvICE9PSBtZWRpYVR5cGUudmlkZW8pIHtcclxuICAgICAgICAgICAgICAgIGlzU2luZ2xlUmVjb3JkZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzU2luZ2xlUmVjb3JkZXIgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuYXVkaW9SZWNvcmRlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnZpZGVvUmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudmlkZW9SZWNvcmRlci5pbml0UmVjb3JkZXIoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hdWRpb1JlY29yZGVyLmluaXRSZWNvcmRlcihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQm90aCByZWNvcmRlcnMgYXJlIHJlYWR5IHRvIHJlY29yZCB0aGluZ3MgYWNjdXJhdGVseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnZpZGVvUmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hdWRpb1JlY29yZGVyLnN0YXJ0UmVjb3JkaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEhbWVkaWFUeXBlLmdpZikge1xyXG4gICAgICAgICAgICByZWNvcmRlclR5cGUgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1lZGlhVHlwZS5naWYgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIHJlY29yZGVyVHlwZSA9IG1lZGlhVHlwZS5naWY7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5naWZSZWNvcmRlciA9IG5ldyBSZWNvcmRSVEMobWVkaWFTdHJlYW0sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdnaWYnLFxyXG4gICAgICAgICAgICAgICAgZnJhbWVSYXRlOiB0aGlzLmZyYW1lUmF0ZSB8fCAyMDAsXHJcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiB0aGlzLnF1YWxpdHkgfHwgMTAsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlTG9nczogdGhpcy5kaXNhYmxlTG9ncyxcclxuICAgICAgICAgICAgICAgIHJlY29yZGVyVHlwZTogcmVjb3JkZXJUeXBlLFxyXG4gICAgICAgICAgICAgICAgbWltZVR5cGU6IG1pbWVUeXBlLmdpZlxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5naWZSZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyByZWNvcmRpbmcuXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uIGlzIGludm9rZWQgd2hlbiBhbGwgZW5jb2RlcnMgZmluaXNoZWQgdGhlaXIgam9icy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIuc3RvcFJlY29yZGluZyhmdW5jdGlvbihyZWNvcmRpbmcpe1xyXG4gICAgICogICAgIHZhciBhdWRpb0Jsb2IgPSByZWNvcmRpbmcuYXVkaW87XHJcbiAgICAgKiAgICAgdmFyIHZpZGVvQmxvYiA9IHJlY29yZGluZy52aWRlbztcclxuICAgICAqICAgICB2YXIgZ2lmQmxvYiAgID0gcmVjb3JkaW5nLmdpZjtcclxuICAgICAqIH0pO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnN0b3BSZWNvcmRpbmcgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24oKSB7fTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYXVkaW9SZWNvcmRlcikge1xyXG4gICAgICAgICAgICB0aGlzLmF1ZGlvUmVjb3JkZXIuc3RvcFJlY29yZGluZyhmdW5jdGlvbihibG9iVVJMKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhibG9iVVJMLCAnYXVkaW8nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy52aWRlb1JlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlkZW9SZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKGJsb2JVUkwpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGJsb2JVUkwsICd2aWRlbycpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmdpZlJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2lmUmVjb3JkZXIuc3RvcFJlY29yZGluZyhmdW5jdGlvbihibG9iVVJMKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhibG9iVVJMLCAnZ2lmJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgcmVjb3JkaW5nLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1SZWNvcmRSVENcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5wYXVzZVJlY29yZGluZygpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnBhdXNlUmVjb3JkaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXVkaW9SZWNvcmRlcikge1xyXG4gICAgICAgICAgICB0aGlzLmF1ZGlvUmVjb3JkZXIucGF1c2VSZWNvcmRpbmcoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnZpZGVvUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyLnBhdXNlUmVjb3JkaW5nKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5naWZSZWNvcmRlcikge1xyXG4gICAgICAgICAgICB0aGlzLmdpZlJlY29yZGVyLnBhdXNlUmVjb3JkaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlc3VtZXMgcmVjb3JkaW5nLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1SZWNvcmRSVENcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5yZXN1bWVSZWNvcmRpbmcoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXN1bWVSZWNvcmRpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5hdWRpb1JlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXVkaW9SZWNvcmRlci5yZXN1bWVSZWNvcmRpbmcoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnZpZGVvUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyLnJlc3VtZVJlY29yZGluZygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZ2lmUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5naWZSZWNvcmRlci5yZXN1bWVSZWNvcmRpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gbWFudWFsbHkgZ2V0IGFsbCByZWNvcmRlZCBibG9icy5cclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQWxsIHJlY29yZGVkIGJsb2JzIGFyZSBwYXNzZWQgYmFjayB0byB0aGUgXCJjYWxsYmFja1wiIGZ1bmN0aW9uLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1SZWNvcmRSVENcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5nZXRCbG9iKGZ1bmN0aW9uKHJlY29yZGluZyl7XHJcbiAgICAgKiAgICAgdmFyIGF1ZGlvQmxvYiA9IHJlY29yZGluZy5hdWRpbztcclxuICAgICAqICAgICB2YXIgdmlkZW9CbG9iID0gcmVjb3JkaW5nLnZpZGVvO1xyXG4gICAgICogICAgIHZhciBnaWZCbG9iICAgPSByZWNvcmRpbmcuZ2lmO1xyXG4gICAgICogfSk7XHJcbiAgICAgKiAvLyBvclxyXG4gICAgICogdmFyIGF1ZGlvQmxvYiA9IHJlY29yZGVyLmdldEJsb2IoKS5hdWRpbztcclxuICAgICAqIHZhciB2aWRlb0Jsb2IgPSByZWNvcmRlci5nZXRCbG9iKCkudmlkZW87XHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ2V0QmxvYiA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG91dHB1dCA9IHt9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5hdWRpb1JlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIG91dHB1dC5hdWRpbyA9IHRoaXMuYXVkaW9SZWNvcmRlci5nZXRCbG9iKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy52aWRlb1JlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIG91dHB1dC52aWRlbyA9IHRoaXMudmlkZW9SZWNvcmRlci5nZXRCbG9iKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5naWZSZWNvcmRlcikge1xyXG4gICAgICAgICAgICBvdXRwdXQuZ2lmID0gdGhpcy5naWZSZWNvcmRlci5nZXRCbG9iKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sob3V0cHV0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVzdHJveSBhbGwgcmVjb3JkZXIgaW5zdGFuY2VzLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1SZWNvcmRSVENcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5kZXN0cm95KCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmF1ZGlvUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5hdWRpb1JlY29yZGVyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy5hdWRpb1JlY29yZGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnZpZGVvUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmdpZlJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2lmUmVjb3JkZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLmdpZlJlY29yZGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gbWFudWFsbHkgZ2V0IGFsbCByZWNvcmRlZCBibG9icycgRGF0YVVSTHMuXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIEFsbCByZWNvcmRlZCBibG9icycgRGF0YVVSTHMgYXJlIHBhc3NlZCBiYWNrIHRvIHRoZSBcImNhbGxiYWNrXCIgZnVuY3Rpb24uXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgTVJlY29yZFJUQ1xyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLmdldERhdGFVUkwoZnVuY3Rpb24ocmVjb3JkaW5nKXtcclxuICAgICAqICAgICB2YXIgYXVkaW9EYXRhVVJMID0gcmVjb3JkaW5nLmF1ZGlvO1xyXG4gICAgICogICAgIHZhciB2aWRlb0RhdGFVUkwgPSByZWNvcmRpbmcudmlkZW87XHJcbiAgICAgKiAgICAgdmFyIGdpZkRhdGFVUkwgICA9IHJlY29yZGluZy5naWY7XHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXREYXRhVVJMID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmdldEJsb2IoZnVuY3Rpb24oYmxvYikge1xyXG4gICAgICAgICAgICBpZiAoYmxvYi5hdWRpbyAmJiBibG9iLnZpZGVvKSB7XHJcbiAgICAgICAgICAgICAgICBnZXREYXRhVVJMKGJsb2IuYXVkaW8sIGZ1bmN0aW9uKF9hdWRpb0RhdGFVUkwpIHtcclxuICAgICAgICAgICAgICAgICAgICBnZXREYXRhVVJMKGJsb2IudmlkZW8sIGZ1bmN0aW9uKF92aWRlb0RhdGFVUkwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXVkaW86IF9hdWRpb0RhdGFVUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlbzogX3ZpZGVvRGF0YVVSTFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGJsb2IuYXVkaW8pIHtcclxuICAgICAgICAgICAgICAgIGdldERhdGFVUkwoYmxvYi5hdWRpbywgZnVuY3Rpb24oX2F1ZGlvRGF0YVVSTCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXVkaW86IF9hdWRpb0RhdGFVUkxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGJsb2IudmlkZW8pIHtcclxuICAgICAgICAgICAgICAgIGdldERhdGFVUkwoYmxvYi52aWRlbywgZnVuY3Rpb24oX3ZpZGVvRGF0YVVSTCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW86IF92aWRlb0RhdGFVUkxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldERhdGFVUkwoYmxvYiwgY2FsbGJhY2swMCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIFdvcmtlciAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHZhciB3ZWJXb3JrZXIgPSBwcm9jZXNzSW5XZWJXb3JrZXIoZnVuY3Rpb24gcmVhZEZpbGUoX2Jsb2IpIHtcclxuICAgICAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZShuZXcgRmlsZVJlYWRlclN5bmMoKS5yZWFkQXNEYXRhVVJMKF9ibG9iKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB3ZWJXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazAwKGV2ZW50LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB3ZWJXb3JrZXIucG9zdE1lc3NhZ2UoYmxvYik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpO1xyXG4gICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2swMChldmVudC50YXJnZXQucmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NJbldlYldvcmtlcihfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIGJsb2IgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtfZnVuY3Rpb24udG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICd0aGlzLm9ubWVzc2FnZSA9ICBmdW5jdGlvbiAoZWVlKSB7JyArIF9mdW5jdGlvbi5uYW1lICsgJyhlZWUuZGF0YSk7fSdcclxuICAgICAgICAgICAgXSwge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnXHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKGJsb2IpO1xyXG4gICAgICAgICAgICB2YXIgdXJsO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIFVSTCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHVybCA9IFVSTDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2Via2l0VVJMICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgdXJsID0gd2Via2l0VVJMO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ05laXRoZXIgVVJMIG5vciB3ZWJraXRVUkwgZGV0ZWN0ZWQuJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB1cmwucmV2b2tlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgICAgICByZXR1cm4gd29ya2VyO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBhc2sge0BsaW5rIE1SZWNvcmRSVEN9IHRvIHdyaXRlIGFsbCByZWNvcmRlZCBibG9icyBpbnRvIEluZGV4ZWREQiBzdG9yYWdlLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1SZWNvcmRSVENcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci53cml0ZVRvRGlzaygpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLndyaXRlVG9EaXNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgUmVjb3JkUlRDLndyaXRlVG9EaXNrKHtcclxuICAgICAgICAgICAgYXVkaW86IHRoaXMuYXVkaW9SZWNvcmRlcixcclxuICAgICAgICAgICAgdmlkZW86IHRoaXMudmlkZW9SZWNvcmRlcixcclxuICAgICAgICAgICAgZ2lmOiB0aGlzLmdpZlJlY29yZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gaW52b2tlIGEgc2F2ZS1hcyBkaWFsb2cgZm9yIGFsbCByZWNvcmRlZCBibG9icy5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhcmdzIC0ge2F1ZGlvOiAnYXVkaW8tbmFtZScsIHZpZGVvOiAndmlkZW8tbmFtZScsIGdpZjogJ2dpZi1uYW1lJ31cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIuc2F2ZSh7XHJcbiAgICAgKiAgICAgYXVkaW86ICdhdWRpby1maWxlLW5hbWUnLFxyXG4gICAgICogICAgIHZpZGVvOiAndmlkZW8tZmlsZS1uYW1lJyxcclxuICAgICAqICAgICBnaWYgIDogJ2dpZi1maWxlLW5hbWUnXHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oYXJncykge1xyXG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHtcclxuICAgICAgICAgICAgYXVkaW86IHRydWUsXHJcbiAgICAgICAgICAgIHZpZGVvOiB0cnVlLFxyXG4gICAgICAgICAgICBnaWY6IHRydWVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoISFhcmdzLmF1ZGlvICYmIHRoaXMuYXVkaW9SZWNvcmRlcikge1xyXG4gICAgICAgICAgICB0aGlzLmF1ZGlvUmVjb3JkZXIuc2F2ZSh0eXBlb2YgYXJncy5hdWRpbyA9PT0gJ3N0cmluZycgPyBhcmdzLmF1ZGlvIDogJycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEhYXJncy52aWRlbyAmJiB0aGlzLnZpZGVvUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyLnNhdmUodHlwZW9mIGFyZ3MudmlkZW8gPT09ICdzdHJpbmcnID8gYXJncy52aWRlbyA6ICcnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEhYXJncy5naWYgJiYgdGhpcy5naWZSZWNvcmRlcikge1xyXG4gICAgICAgICAgICB0aGlzLmdpZlJlY29yZGVyLnNhdmUodHlwZW9mIGFyZ3MuZ2lmID09PSAnc3RyaW5nJyA/IGFyZ3MuZ2lmIDogJycpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBnZXQgYWxsIHJlY29yZGVkIGJsb2JzIGZyb20gSW5kZXhlZERCIHN0b3JhZ2UuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gJ2FsbCcgb3IgJ2F1ZGlvJyBvciAndmlkZW8nIG9yICdnaWYnXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24gdG8gZ2V0IGFsbCBzdG9yZWQgYmxvYnMuXHJcbiAqIEBtZXRob2RcclxuICogQG1lbWJlcm9mIE1SZWNvcmRSVENcclxuICogQGV4YW1wbGVcclxuICogTVJlY29yZFJUQy5nZXRGcm9tRGlzaygnYWxsJywgZnVuY3Rpb24oZGF0YVVSTCwgdHlwZSl7XHJcbiAqICAgICBpZih0eXBlID09PSAnYXVkaW8nKSB7IH1cclxuICogICAgIGlmKHR5cGUgPT09ICd2aWRlbycpIHsgfVxyXG4gKiAgICAgaWYodHlwZSA9PT0gJ2dpZicpICAgeyB9XHJcbiAqIH0pO1xyXG4gKi9cclxuTVJlY29yZFJUQy5nZXRGcm9tRGlzayA9IFJlY29yZFJUQy5nZXRGcm9tRGlzaztcclxuXHJcbi8qKlxyXG4gKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBzdG9yZSByZWNvcmRlZCBibG9icyBpbnRvIEluZGV4ZWREQiBzdG9yYWdlLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAtIHthdWRpbzogQmxvYiwgdmlkZW86IEJsb2IsIGdpZjogQmxvYn1cclxuICogQG1ldGhvZFxyXG4gKiBAbWVtYmVyb2YgTVJlY29yZFJUQ1xyXG4gKiBAZXhhbXBsZVxyXG4gKiBNUmVjb3JkUlRDLndyaXRlVG9EaXNrKHtcclxuICogICAgIGF1ZGlvOiBhdWRpb0Jsb2IsXHJcbiAqICAgICB2aWRlbzogdmlkZW9CbG9iLFxyXG4gKiAgICAgZ2lmICA6IGdpZkJsb2JcclxuICogfSk7XHJcbiAqL1xyXG5NUmVjb3JkUlRDLndyaXRlVG9EaXNrID0gUmVjb3JkUlRDLndyaXRlVG9EaXNrO1xyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBSZWNvcmRSVEMuTVJlY29yZFJUQyA9IE1SZWNvcmRSVEM7XHJcbn1cblxyXG52YXIgYnJvd3NlckZha2VVc2VyQWdlbnQgPSAnRmFrZS81LjAgKEZha2VPUykgQXBwbGVXZWJLaXQvMTIzIChLSFRNTCwgbGlrZSBHZWNrbykgRmFrZS8xMi4zLjQ1NjcuODkgRmFrZS8xMjMuNDUnO1xyXG5cclxuKGZ1bmN0aW9uKHRoYXQpIHtcclxuICAgIGlmICghdGhhdCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGdsb2JhbC5uYXZpZ2F0b3IgPSB7XHJcbiAgICAgICAgdXNlckFnZW50OiBicm93c2VyRmFrZVVzZXJBZ2VudCxcclxuICAgICAgICBnZXRVc2VyTWVkaWE6IGZ1bmN0aW9uKCkge31cclxuICAgIH07XHJcblxyXG4gICAgaWYgKCFnbG9iYWwuY29uc29sZSkge1xyXG4gICAgICAgIGdsb2JhbC5jb25zb2xlID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwuY29uc29sZS5sb2cgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBnbG9iYWwuY29uc29sZS5lcnJvciA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBnbG9iYWwuY29uc29sZS5lcnJvciA9IGdsb2JhbC5jb25zb2xlLmxvZyA9IGdsb2JhbC5jb25zb2xlLmxvZyB8fCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYXJndW1lbnRzKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLypnbG9iYWwgZG9jdW1lbnQ6dHJ1ZSAqL1xyXG4gICAgICAgIHRoYXQuZG9jdW1lbnQgPSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50RWxlbWVudDoge1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jYXB0dXJlU3RyZWFtID0gZG9jdW1lbnQubW96Q2FwdHVyZVN0cmVhbSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0ge1xyXG4gICAgICAgICAgICAgICAgZ2V0Q29udGV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwbGF5OiBmdW5jdGlvbigpIHt9LFxyXG4gICAgICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uKCkge30sXHJcbiAgICAgICAgICAgICAgICBkcmF3SW1hZ2U6IGZ1bmN0aW9uKCkge30sXHJcbiAgICAgICAgICAgICAgICB0b0RhdGFVUkw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge31cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGF0LkhUTUxWaWRlb0VsZW1lbnQgPSBmdW5jdGlvbigpIHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgbG9jYXRpb24gPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLypnbG9iYWwgbG9jYXRpb246dHJ1ZSAqL1xyXG4gICAgICAgIHRoYXQubG9jYXRpb24gPSB7XHJcbiAgICAgICAgICAgIHByb3RvY29sOiAnZmlsZTonLFxyXG4gICAgICAgICAgICBocmVmOiAnJyxcclxuICAgICAgICAgICAgaGFzaDogJydcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2Ygc2NyZWVuID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8qZ2xvYmFsIHNjcmVlbjp0cnVlICovXHJcbiAgICAgICAgdGhhdC5zY3JlZW4gPSB7XHJcbiAgICAgICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDBcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgVVJMID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8qZ2xvYmFsIHNjcmVlbjp0cnVlICovXHJcbiAgICAgICAgdGhhdC5VUkwgPSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZU9iamVjdFVSTDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJldm9rZU9iamVjdFVSTDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qZ2xvYmFsIHdpbmRvdzp0cnVlICovXHJcbiAgICB0aGF0LndpbmRvdyA9IGdsb2JhbDtcclxufSkodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiBudWxsKTtcblxyXG4vLyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX1xyXG4vLyBDcm9zcy1Ccm93c2VyLURlY2xhcmF0aW9ucy5qc1xyXG5cclxuLy8gYW5pbWF0aW9uLWZyYW1lIHVzZWQgaW4gV2ViTSByZWNvcmRpbmdcclxuXHJcbi8qanNoaW50IC1XMDc5ICovXHJcbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG5pZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGlmICh0eXBlb2Ygd2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8qZ2xvYmFsIHJlcXVlc3RBbmltYXRpb25GcmFtZTp0cnVlICovXHJcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8qZ2xvYmFsIHJlcXVlc3RBbmltYXRpb25GcmFtZTp0cnVlICovXHJcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gbW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLypnbG9iYWwgcmVxdWVzdEFuaW1hdGlvbkZyYW1lOnRydWUgKi9cclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBtc1JlcXVlc3RBbmltYXRpb25GcmFtZTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvLyB2aWE6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL3BhdWxpcmlzaC8xNTc5NjcxXHJcbiAgICAgICAgdmFyIGxhc3RUaW1lID0gMDtcclxuXHJcbiAgICAgICAgLypnbG9iYWwgcmVxdWVzdEFuaW1hdGlvbkZyYW1lOnRydWUgKi9cclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XHJcbiAgICAgICAgICAgIHZhciBpZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpO1xyXG4gICAgICAgICAgICB9LCB0aW1lVG9DYWxsKTtcclxuICAgICAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XHJcbiAgICAgICAgICAgIHJldHVybiBpZDtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG4vKmpzaGludCAtVzA3OSAqL1xyXG52YXIgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcbmlmICh0eXBlb2YgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBpZiAodHlwZW9mIHdlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8qZ2xvYmFsIGNhbmNlbEFuaW1hdGlvbkZyYW1lOnRydWUgKi9cclxuICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLypnbG9iYWwgY2FuY2VsQW5pbWF0aW9uRnJhbWU6dHJ1ZSAqL1xyXG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gbW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtc0NhbmNlbEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8qZ2xvYmFsIGNhbmNlbEFuaW1hdGlvbkZyYW1lOnRydWUgKi9cclxuICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IG1zQ2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBjYW5jZWxBbmltYXRpb25GcmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvKmdsb2JhbCBjYW5jZWxBbmltYXRpb25GcmFtZTp0cnVlICovXHJcbiAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaWQpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIFdlYkF1ZGlvIEFQSSByZXByZXNlbnRlclxyXG52YXIgQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dDtcclxuXHJcbmlmICh0eXBlb2YgQXVkaW9Db250ZXh0ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgaWYgKHR5cGVvZiB3ZWJraXRBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLypnbG9iYWwgQXVkaW9Db250ZXh0OnRydWUgKi9cclxuICAgICAgICBBdWRpb0NvbnRleHQgPSB3ZWJraXRBdWRpb0NvbnRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBtb3pBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLypnbG9iYWwgQXVkaW9Db250ZXh0OnRydWUgKi9cclxuICAgICAgICBBdWRpb0NvbnRleHQgPSBtb3pBdWRpb0NvbnRleHQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qanNoaW50IC1XMDc5ICovXHJcbnZhciBVUkwgPSB3aW5kb3cuVVJMO1xyXG5cclxuaWYgKHR5cGVvZiBVUkwgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3ZWJraXRVUkwgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAvKmdsb2JhbCBVUkw6dHJ1ZSAqL1xyXG4gICAgVVJMID0gd2Via2l0VVJMO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPT09ICd1bmRlZmluZWQnKSB7IC8vIG1heWJlIHdpbmRvdy5uYXZpZ2F0b3I/XHJcbiAgICBpZiAodHlwZW9mIG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPSBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhO1xyXG4gICAgfVxyXG59XHJcblxyXG52YXIgaXNFZGdlID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgIT09IC0xICYmICghIW5hdmlnYXRvci5tc1NhdmVCbG9iIHx8ICEhbmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpO1xyXG52YXIgaXNPcGVyYSA9ICEhd2luZG93Lm9wZXJhIHx8IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignT1BSLycpICE9PSAtMTtcclxudmFyIGlzRmlyZWZveCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSAmJiAoJ25ldHNjYXBlJyBpbiB3aW5kb3cpICYmIC8gcnY6Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xyXG52YXIgaXNDaHJvbWUgPSAoIWlzT3BlcmEgJiYgIWlzRWRnZSAmJiAhIW5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEpIHx8IGlzRWxlY3Ryb24oKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignY2hyb21lLycpICE9PSAtMTtcclxuXHJcbnZhciBpc1NhZmFyaSA9IC9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XHJcblxyXG5pZiAoaXNTYWZhcmkgJiYgIWlzQ2hyb21lICYmIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQ3JpT1MnKSAhPT0gLTEpIHtcclxuICAgIGlzU2FmYXJpID0gZmFsc2U7XHJcbiAgICBpc0Nocm9tZSA9IHRydWU7XHJcbn1cclxuXHJcbnZhciBNZWRpYVN0cmVhbSA9IHdpbmRvdy5NZWRpYVN0cmVhbTtcclxuXHJcbmlmICh0eXBlb2YgTWVkaWFTdHJlYW0gPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3ZWJraXRNZWRpYVN0cmVhbSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIE1lZGlhU3RyZWFtID0gd2Via2l0TWVkaWFTdHJlYW07XHJcbn1cclxuXHJcbi8qZ2xvYmFsIE1lZGlhU3RyZWFtOnRydWUgKi9cclxuaWYgKHR5cGVvZiBNZWRpYVN0cmVhbSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIC8vIG92ZXJyaWRlIFwic3RvcFwiIG1ldGhvZCBmb3IgYWxsIGJyb3dzZXJzXHJcbiAgICBpZiAodHlwZW9mIE1lZGlhU3RyZWFtLnByb3RvdHlwZS5zdG9wID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIE1lZGlhU3RyZWFtLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0VHJhY2tzKCkuZm9yRWFjaChmdW5jdGlvbih0cmFjaykge1xyXG4gICAgICAgICAgICAgICAgdHJhY2suc3RvcCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBiZWxvdyBmdW5jdGlvbiB2aWE6IGh0dHA6Ly9nb28uZ2wvQjNhZThjXHJcbi8qKlxyXG4gKiBSZXR1cm4gaHVtYW4tcmVhZGFibGUgZmlsZSBzaXplLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gYnl0ZXMgLSBQYXNzIGJ5dGVzIGFuZCBnZXQgZm9ybWF0dGVkIHN0cmluZy5cclxuICogQHJldHVybnMge3N0cmluZ30gLSBmb3JtYXR0ZWQgc3RyaW5nXHJcbiAqIEBleGFtcGxlXHJcbiAqIGJ5dGVzVG9TaXplKDEwMjQqMTAyNCo1KSA9PT0gJzUgR0InXHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICovXHJcbmZ1bmN0aW9uIGJ5dGVzVG9TaXplKGJ5dGVzKSB7XHJcbiAgICB2YXIgayA9IDEwMDA7XHJcbiAgICB2YXIgc2l6ZXMgPSBbJ0J5dGVzJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ107XHJcbiAgICBpZiAoYnl0ZXMgPT09IDApIHtcclxuICAgICAgICByZXR1cm4gJzAgQnl0ZXMnO1xyXG4gICAgfVxyXG4gICAgdmFyIGkgPSBwYXJzZUludChNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKSwgMTApO1xyXG4gICAgcmV0dXJuIChieXRlcyAvIE1hdGgucG93KGssIGkpKS50b1ByZWNpc2lvbigzKSArICcgJyArIHNpemVzW2ldO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtCbG9ifSBmaWxlIC0gRmlsZSBvciBCbG9iIG9iamVjdC4gVGhpcyBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlTmFtZSAtIE9wdGlvbmFsIGZpbGUgbmFtZSBlLmcuIFwiUmVjb3JkZWQtVmlkZW8ud2VibVwiXHJcbiAqIEBleGFtcGxlXHJcbiAqIGludm9rZVNhdmVBc0RpYWxvZyhibG9iIG9yIGZpbGUsIFtvcHRpb25hbF0gZmlsZU5hbWUpO1xyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQ3xSZWNvcmRSVEMgU291cmNlIENvZGV9XHJcbiAqL1xyXG5mdW5jdGlvbiBpbnZva2VTYXZlQXNEaWFsb2coZmlsZSwgZmlsZU5hbWUpIHtcclxuICAgIGlmICghZmlsZSkge1xyXG4gICAgICAgIHRocm93ICdCbG9iIG9iamVjdCBpcyByZXF1aXJlZC4nO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghZmlsZS50eXBlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZmlsZS50eXBlID0gJ3ZpZGVvL3dlYm0nO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGZpbGVFeHRlbnNpb24gPSAoZmlsZS50eXBlIHx8ICd2aWRlby93ZWJtJykuc3BsaXQoJy8nKVsxXTtcclxuICAgIGlmIChmaWxlRXh0ZW5zaW9uLmluZGV4T2YoJzsnKSAhPT0gLTEpIHtcclxuICAgICAgICAvLyBleHRlbmRlZCBtaW1ldHlwZSwgZS5nLiAndmlkZW8vd2VibTtjb2RlY3M9dnA4LG9wdXMnXHJcbiAgICAgICAgZmlsZUV4dGVuc2lvbiA9IGZpbGVFeHRlbnNpb24uc3BsaXQoJzsnKVswXTtcclxuICAgIH1cclxuICAgIGlmIChmaWxlTmFtZSAmJiBmaWxlTmFtZS5pbmRleE9mKCcuJykgIT09IC0xKSB7XHJcbiAgICAgICAgdmFyIHNwbGl0dGVkID0gZmlsZU5hbWUuc3BsaXQoJy4nKTtcclxuICAgICAgICBmaWxlTmFtZSA9IHNwbGl0dGVkWzBdO1xyXG4gICAgICAgIGZpbGVFeHRlbnNpb24gPSBzcGxpdHRlZFsxXTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZmlsZUZ1bGxOYW1lID0gKGZpbGVOYW1lIHx8IChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiA5OTk5OTk5OTk5KSArIDg4ODg4ODg4OCkpICsgJy4nICsgZmlsZUV4dGVuc2lvbjtcclxuXHJcbiAgICBpZiAodHlwZW9mIG5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJldHVybiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihmaWxlLCBmaWxlRnVsbE5hbWUpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbmF2aWdhdG9yLm1zU2F2ZUJsb2IgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvci5tc1NhdmVCbG9iKGZpbGUsIGZpbGVGdWxsTmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGh5cGVybGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIGh5cGVybGluay5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcclxuICAgIGh5cGVybGluay5kb3dubG9hZCA9IGZpbGVGdWxsTmFtZTtcclxuXHJcbiAgICBoeXBlcmxpbmsuc3R5bGUgPSAnZGlzcGxheTpub25lO29wYWNpdHk6MDtjb2xvcjp0cmFuc3BhcmVudDsnO1xyXG4gICAgKGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChoeXBlcmxpbmspO1xyXG5cclxuICAgIGlmICh0eXBlb2YgaHlwZXJsaW5rLmNsaWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgaHlwZXJsaW5rLmNsaWNrKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGh5cGVybGluay50YXJnZXQgPSAnX2JsYW5rJztcclxuICAgICAgICBoeXBlcmxpbmsuZGlzcGF0Y2hFdmVudChuZXcgTW91c2VFdmVudCgnY2xpY2snLCB7XHJcbiAgICAgICAgICAgIHZpZXc6IHdpbmRvdyxcclxuICAgICAgICAgICAgYnViYmxlczogdHJ1ZSxcclxuICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGh5cGVybGluay5ocmVmKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGV0b24vaXMtZWxlY3Ryb24vYmxvYi9tYXN0ZXIvaW5kZXguanNcclxuICoqL1xyXG5mdW5jdGlvbiBpc0VsZWN0cm9uKCkge1xyXG4gICAgLy8gUmVuZGVyZXIgcHJvY2Vzc1xyXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cucHJvY2VzcyA9PT0gJ29iamVjdCcgJiYgd2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJykge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1haW4gcHJvY2Vzc1xyXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcHJvY2Vzcy52ZXJzaW9ucyA9PT0gJ29iamVjdCcgJiYgISFwcm9jZXNzLnZlcnNpb25zLmVsZWN0cm9uKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGV0ZWN0IHRoZSB1c2VyIGFnZW50IHdoZW4gdGhlIGBub2RlSW50ZWdyYXRpb25gIG9wdGlvbiBpcyBzZXQgdG8gdHJ1ZVxyXG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgPT09ICdvYmplY3QnICYmIHR5cGVvZiBuYXZpZ2F0b3IudXNlckFnZW50ID09PSAnc3RyaW5nJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0VsZWN0cm9uJykgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VHJhY2tzKHN0cmVhbSwga2luZCkge1xyXG4gICAgaWYgKCFzdHJlYW0gfHwgIXN0cmVhbS5nZXRUcmFja3MpIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN0cmVhbS5nZXRUcmFja3MoKS5maWx0ZXIoZnVuY3Rpb24odCkge1xyXG4gICAgICAgIHJldHVybiB0LmtpbmQgPT09IChraW5kIHx8ICdhdWRpbycpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFNyY09iamVjdChzdHJlYW0sIGVsZW1lbnQpIHtcclxuICAgIGlmICgnc3JjT2JqZWN0JyBpbiBlbGVtZW50KSB7XHJcbiAgICAgICAgZWxlbWVudC5zcmNPYmplY3QgPSBzdHJlYW07XHJcbiAgICB9IGVsc2UgaWYgKCdtb3pTcmNPYmplY3QnIGluIGVsZW1lbnQpIHtcclxuICAgICAgICBlbGVtZW50Lm1velNyY09iamVjdCA9IHN0cmVhbTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbWVudC5zcmNPYmplY3QgPSBzdHJlYW07XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge0Jsb2J9IGZpbGUgLSBGaWxlIG9yIEJsb2Igb2JqZWN0LlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRTZWVrYWJsZUJsb2IoYmxvYiBvciBmaWxlLCBjYWxsYmFjayk7XHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFNlZWthYmxlQmxvYihpbnB1dEJsb2IsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBFQk1MLmpzIGNvcHlyaWdodHMgZ29lcyB0bzogaHR0cHM6Ly9naXRodWIuY29tL2xlZ29raWNoaS90cy1lYm1sXHJcbiAgICBpZiAodHlwZW9mIEVCTUwgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgbGluazogaHR0cHM6Ly93d3cud2VicnRjLWV4cGVyaW1lbnQuY29tL0VCTUwuanMnKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcmVhZGVyID0gbmV3IEVCTUwuUmVhZGVyKCk7XHJcbiAgICB2YXIgZGVjb2RlciA9IG5ldyBFQk1MLkRlY29kZXIoKTtcclxuICAgIHZhciB0b29scyA9IEVCTUwudG9vbHM7XHJcblxyXG4gICAgdmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGVibWxFbG1zID0gZGVjb2Rlci5kZWNvZGUodGhpcy5yZXN1bHQpO1xyXG4gICAgICAgIGVibWxFbG1zLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZChlbGVtZW50KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZWFkZXIuc3RvcCgpO1xyXG4gICAgICAgIHZhciByZWZpbmVkTWV0YWRhdGFCdWYgPSB0b29scy5tYWtlTWV0YWRhdGFTZWVrYWJsZShyZWFkZXIubWV0YWRhdGFzLCByZWFkZXIuZHVyYXRpb24sIHJlYWRlci5jdWVzKTtcclxuICAgICAgICB2YXIgYm9keSA9IHRoaXMucmVzdWx0LnNsaWNlKHJlYWRlci5tZXRhZGF0YVNpemUpO1xyXG4gICAgICAgIHZhciBuZXdCbG9iID0gbmV3IEJsb2IoW3JlZmluZWRNZXRhZGF0YUJ1ZiwgYm9keV0sIHtcclxuICAgICAgICAgICAgdHlwZTogJ3ZpZGVvL3dlYm0nXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNhbGxiYWNrKG5ld0Jsb2IpO1xyXG4gICAgfTtcclxuICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoaW5wdXRCbG9iKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBSZWNvcmRSVEMuaW52b2tlU2F2ZUFzRGlhbG9nID0gaW52b2tlU2F2ZUFzRGlhbG9nO1xyXG4gICAgUmVjb3JkUlRDLmdldFRyYWNrcyA9IGdldFRyYWNrcztcclxuICAgIFJlY29yZFJUQy5nZXRTZWVrYWJsZUJsb2IgPSBnZXRTZWVrYWJsZUJsb2I7XHJcbiAgICBSZWNvcmRSVEMuYnl0ZXNUb1NpemUgPSBieXRlc1RvU2l6ZTtcclxuICAgIFJlY29yZFJUQy5pc0VsZWN0cm9uID0gaXNFbGVjdHJvbjtcclxufVxyXG5cclxuLy8gX19fX19fX19fXyAodXNlZCB0byBoYW5kbGUgc3R1ZmYgbGlrZSBodHRwOi8vZ29vLmdsL3htRTVlZykgaXNzdWUgIzEyOVxyXG4vLyBTdG9yYWdlLmpzXHJcblxyXG4vKipcclxuICogU3RvcmFnZSBpcyBhIHN0YW5kYWxvbmUgb2JqZWN0IHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gc3RvcmUgcmV1c2FibGUgb2JqZWN0cyBlLmcuIFwibmV3IEF1ZGlvQ29udGV4dFwiLlxyXG4gKiBAbGljZW5zZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEMvYmxvYi9tYXN0ZXIvTElDRU5TRXxNSVR9XHJcbiAqIEBhdXRob3Ige0BsaW5rIGh0dHBzOi8vTXVhektoYW4uY29tfE11YXogS2hhbn1cclxuICogQGV4YW1wbGVcclxuICogU3RvcmFnZS5BdWRpb0NvbnRleHQgPT09IHdlYmtpdEF1ZGlvQ29udGV4dFxyXG4gKiBAcHJvcGVydHkge3dlYmtpdEF1ZGlvQ29udGV4dH0gQXVkaW9Db250ZXh0IC0gS2VlcHMgYSByZWZlcmVuY2UgdG8gQXVkaW9Db250ZXh0IG9iamVjdC5cclxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEN8UmVjb3JkUlRDIFNvdXJjZSBDb2RlfVxyXG4gKi9cclxuXHJcbnZhciBTdG9yYWdlID0ge307XHJcblxyXG5pZiAodHlwZW9mIEF1ZGlvQ29udGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIFN0b3JhZ2UuQXVkaW9Db250ZXh0ID0gQXVkaW9Db250ZXh0O1xyXG59IGVsc2UgaWYgKHR5cGVvZiB3ZWJraXRBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBTdG9yYWdlLkF1ZGlvQ29udGV4dCA9IHdlYmtpdEF1ZGlvQ29udGV4dDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBSZWNvcmRSVEMuU3RvcmFnZSA9IFN0b3JhZ2U7XHJcbn1cblxyXG5mdW5jdGlvbiBpc01lZGlhUmVjb3JkZXJDb21wYXRpYmxlKCkge1xyXG4gICAgaWYgKGlzRmlyZWZveCB8fCBpc1NhZmFyaSB8fCBpc0VkZ2UpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgblZlciA9IG5hdmlnYXRvci5hcHBWZXJzaW9uO1xyXG4gICAgdmFyIG5BZ3QgPSBuYXZpZ2F0b3IudXNlckFnZW50O1xyXG4gICAgdmFyIGZ1bGxWZXJzaW9uID0gJycgKyBwYXJzZUZsb2F0KG5hdmlnYXRvci5hcHBWZXJzaW9uKTtcclxuICAgIHZhciBtYWpvclZlcnNpb24gPSBwYXJzZUludChuYXZpZ2F0b3IuYXBwVmVyc2lvbiwgMTApO1xyXG4gICAgdmFyIG5hbWVPZmZzZXQsIHZlck9mZnNldCwgaXg7XHJcblxyXG4gICAgaWYgKGlzQ2hyb21lIHx8IGlzT3BlcmEpIHtcclxuICAgICAgICB2ZXJPZmZzZXQgPSBuQWd0LmluZGV4T2YoJ0Nocm9tZScpO1xyXG4gICAgICAgIGZ1bGxWZXJzaW9uID0gbkFndC5zdWJzdHJpbmcodmVyT2Zmc2V0ICsgNyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdHJpbSB0aGUgZnVsbFZlcnNpb24gc3RyaW5nIGF0IHNlbWljb2xvbi9zcGFjZSBpZiBwcmVzZW50XHJcbiAgICBpZiAoKGl4ID0gZnVsbFZlcnNpb24uaW5kZXhPZignOycpKSAhPT0gLTEpIHtcclxuICAgICAgICBmdWxsVmVyc2lvbiA9IGZ1bGxWZXJzaW9uLnN1YnN0cmluZygwLCBpeCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKChpeCA9IGZ1bGxWZXJzaW9uLmluZGV4T2YoJyAnKSkgIT09IC0xKSB7XHJcbiAgICAgICAgZnVsbFZlcnNpb24gPSBmdWxsVmVyc2lvbi5zdWJzdHJpbmcoMCwgaXgpO1xyXG4gICAgfVxyXG5cclxuICAgIG1ham9yVmVyc2lvbiA9IHBhcnNlSW50KCcnICsgZnVsbFZlcnNpb24sIDEwKTtcclxuXHJcbiAgICBpZiAoaXNOYU4obWFqb3JWZXJzaW9uKSkge1xyXG4gICAgICAgIGZ1bGxWZXJzaW9uID0gJycgKyBwYXJzZUZsb2F0KG5hdmlnYXRvci5hcHBWZXJzaW9uKTtcclxuICAgICAgICBtYWpvclZlcnNpb24gPSBwYXJzZUludChuYXZpZ2F0b3IuYXBwVmVyc2lvbiwgMTApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtYWpvclZlcnNpb24gPj0gNDk7XHJcbn1cblxyXG4vLyBfX19fX19fX19fX19fX19fX19fX19fXHJcbi8vIE1lZGlhU3RyZWFtUmVjb3JkZXIuanNcclxuXHJcbi8qKlxyXG4gKiBNZWRpYVN0cmVhbVJlY29yZGVyIGlzIGFuIGFic3RyYWN0aW9uIGxheWVyIGZvciB7QGxpbmsgaHR0cHM6Ly93M2MuZ2l0aHViLmlvL21lZGlhY2FwdHVyZS1yZWNvcmQvTWVkaWFSZWNvcmRlci5odG1sfE1lZGlhUmVjb3JkZXIgQVBJfS4gSXQgaXMgdXNlZCBieSB7QGxpbmsgUmVjb3JkUlRDfSB0byByZWNvcmQgTWVkaWFTdHJlYW0ocykgaW4gYm90aCBDaHJvbWUgYW5kIEZpcmVmb3guXHJcbiAqIEBzdW1tYXJ5IFJ1bnMgdG9wIG92ZXIge0BsaW5rIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9tZWRpYWNhcHR1cmUtcmVjb3JkL01lZGlhUmVjb3JkZXIuaHRtbHxNZWRpYVJlY29yZGVyIEFQSX0uXHJcbiAqIEBsaWNlbnNlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQy9ibG9iL21hc3Rlci9MSUNFTlNFfE1JVH1cclxuICogQGF1dGhvciB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbnxNdWF6IEtoYW59XHJcbiAqIEB0eXBlZGVmIE1lZGlhU3RyZWFtUmVjb3JkZXJcclxuICogQGNsYXNzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBjb25maWcgPSB7XHJcbiAqICAgICBtaW1lVHlwZTogJ3ZpZGVvL3dlYm0nLCAvLyB2cDgsIHZwOSwgaDI2NCwgbWt2LCBvcHVzL3ZvcmJpc1xyXG4gKiAgICAgYXVkaW9CaXRzUGVyU2Vjb25kIDogMjU2ICogOCAqIDEwMjQsXHJcbiAqICAgICB2aWRlb0JpdHNQZXJTZWNvbmQgOiAyNTYgKiA4ICogMTAyNCxcclxuICogICAgIGJpdHNQZXJTZWNvbmQ6IDI1NiAqIDggKiAxMDI0LCAgLy8gaWYgdGhpcyBpcyBwcm92aWRlZCwgc2tpcCBhYm92ZSB0d29cclxuICogICAgIGNoZWNrRm9ySW5hY3RpdmVUcmFja3M6IHRydWUsXHJcbiAqICAgICB0aW1lU2xpY2U6IDEwMDAsIC8vIGNvbmNhdGVuYXRlIGludGVydmFscyBiYXNlZCBibG9ic1xyXG4gKiAgICAgb25kYXRhYXZhaWxhYmxlOiBmdW5jdGlvbigpIHt9IC8vIGdldCBpbnRlcnZhbHMgYmFzZWQgYmxvYnNcclxuICogfVxyXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgTWVkaWFTdHJlYW1SZWNvcmRlcihtZWRpYVN0cmVhbSwgY29uZmlnKTtcclxuICogcmVjb3JkZXIucmVjb3JkKCk7XHJcbiAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICpcclxuICogICAgIC8vIG9yXHJcbiAqICAgICB2YXIgYmxvYiA9IHJlY29yZGVyLmJsb2I7XHJcbiAqIH0pO1xyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQ3xSZWNvcmRSVEMgU291cmNlIENvZGV9XHJcbiAqIEBwYXJhbSB7TWVkaWFTdHJlYW19IG1lZGlhU3RyZWFtIC0gTWVkaWFTdHJlYW0gb2JqZWN0IGZldGNoZWQgdXNpbmcgZ2V0VXNlck1lZGlhIEFQSSBvciBnZW5lcmF0ZWQgdXNpbmcgY2FwdHVyZVN0cmVhbVVudGlsRW5kZWQgb3IgV2ViQXVkaW8gQVBJLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIC0ge2Rpc2FibGVMb2dzOnRydWUsIGluaXRDYWxsYmFjazogZnVuY3Rpb24sIG1pbWVUeXBlOiBcInZpZGVvL3dlYm1cIiwgdGltZVNsaWNlOiAxMDAwfVxyXG4gKiBAdGhyb3dzIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgZmlyc3QgYXJndW1lbnQgXCJNZWRpYVN0cmVhbVwiIGlzIG1pc3NpbmcuIEFsc28gdGhyb3dzIGVycm9yIGlmIFwiTWVkaWFSZWNvcmRlciBBUElcIiBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlci5cclxuICovXHJcblxyXG5mdW5jdGlvbiBNZWRpYVN0cmVhbVJlY29yZGVyKG1lZGlhU3RyZWFtLCBjb25maWcpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBpZiAodHlwZW9mIG1lZGlhU3RyZWFtID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHRocm93ICdGaXJzdCBhcmd1bWVudCBcIk1lZGlhU3RyZWFtXCIgaXMgcmVxdWlyZWQuJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIE1lZGlhUmVjb3JkZXIgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgdGhyb3cgJ1lvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHRoZSBNZWRpYSBSZWNvcmRlciBBUEkuIFBsZWFzZSB0cnkgb3RoZXIgbW9kdWxlcyBlLmcuIFdoYW1teVJlY29yZGVyIG9yIFN0ZXJlb0F1ZGlvUmVjb3JkZXIuJztcclxuICAgIH1cclxuXHJcbiAgICBjb25maWcgPSBjb25maWcgfHwge1xyXG4gICAgICAgIC8vIGJpdHNQZXJTZWNvbmQ6IDI1NiAqIDggKiAxMDI0LFxyXG4gICAgICAgIG1pbWVUeXBlOiAndmlkZW8vd2VibSdcclxuICAgIH07XHJcblxyXG4gICAgaWYgKGNvbmZpZy50eXBlID09PSAnYXVkaW8nKSB7XHJcbiAgICAgICAgaWYgKGdldFRyYWNrcyhtZWRpYVN0cmVhbSwgJ3ZpZGVvJykubGVuZ3RoICYmIGdldFRyYWNrcyhtZWRpYVN0cmVhbSwgJ2F1ZGlvJykubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBzdHJlYW07XHJcbiAgICAgICAgICAgIGlmICghIW5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEpIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLmFkZFRyYWNrKGdldFRyYWNrcyhtZWRpYVN0cmVhbSwgJ2F1ZGlvJylbMF0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gd2Via2l0TWVkaWFTdHJlYW1cclxuICAgICAgICAgICAgICAgIHN0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbShnZXRUcmFja3MobWVkaWFTdHJlYW0sICdhdWRpbycpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtZWRpYVN0cmVhbSA9IHN0cmVhbTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY29uZmlnLm1pbWVUeXBlIHx8IGNvbmZpZy5taW1lVHlwZS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYXVkaW8nKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgY29uZmlnLm1pbWVUeXBlID0gaXNDaHJvbWUgPyAnYXVkaW8vd2VibScgOiAnYXVkaW8vb2dnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb25maWcubWltZVR5cGUgJiYgY29uZmlnLm1pbWVUeXBlLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSAhPT0gJ2F1ZGlvL29nZycgJiYgISFuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhKSB7XHJcbiAgICAgICAgICAgIC8vIGZvcmNpbmcgYmV0dGVyIGNvZGVjcyBvbiBGaXJlZm94ICh2aWEgIzE2NilcclxuICAgICAgICAgICAgY29uZmlnLm1pbWVUeXBlID0gJ2F1ZGlvL29nZyc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBhcnJheU9mQmxvYnMgPSBbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJldHVybnMgYXJyYXkgb2YgYmxvYnMuIFVzZSBvbmx5IHdpdGggXCJ0aW1lU2xpY2VcIi4gSXRzIHVzZWZ1bCB0byBwcmV2aWV3IHJlY29yZGluZyBhbnl0aW1lLCB3aXRob3V0IHVzaW5nIHRoZSBcInN0b3BcIiBtZXRob2QuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHZhciBhcnJheU9mQmxvYnMgPSByZWNvcmRlci5nZXRBcnJheU9mQmxvYnMoKTtcclxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhcnJheSBvZiByZWNvcmRlZCBibG9icy5cclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRBcnJheU9mQmxvYnMgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gYXJyYXlPZkJsb2JzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlY29yZHMgTWVkaWFTdHJlYW0uXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnJlY29yZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIHNldCBkZWZhdWx0c1xyXG4gICAgICAgIHNlbGYuYmxvYiA9IG51bGw7XHJcbiAgICAgICAgc2VsZi5jbGVhclJlY29yZGVkRGF0YSgpO1xyXG4gICAgICAgIHNlbGYudGltZXN0YW1wcyA9IFtdO1xyXG4gICAgICAgIGFsbFN0YXRlcyA9IFtdO1xyXG4gICAgICAgIGFycmF5T2ZCbG9icyA9IFtdO1xyXG5cclxuICAgICAgICB2YXIgcmVjb3JkZXJIaW50cyA9IGNvbmZpZztcclxuXHJcbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1Bhc3NpbmcgZm9sbG93aW5nIGNvbmZpZyBvdmVyIE1lZGlhUmVjb3JkZXIgQVBJLicsIHJlY29yZGVySGludHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgLy8gbWFuZGF0b3J5IHRvIG1ha2Ugc3VyZSBGaXJlZm94IGRvZXNuJ3QgZmFpbHMgdG8gcmVjb3JkIHN0cmVhbXMgMy00IHRpbWVzIHdpdGhvdXQgcmVsb2FkaW5nIHRoZSBwYWdlLlxyXG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Nocm9tZSAmJiAhaXNNZWRpYVJlY29yZGVyQ29tcGF0aWJsZSgpKSB7XHJcbiAgICAgICAgICAgIC8vIHRvIHN1cHBvcnQgdmlkZW8tb25seSByZWNvcmRpbmcgb24gc3RhYmxlXHJcbiAgICAgICAgICAgIHJlY29yZGVySGludHMgPSAndmlkZW8vdnA4JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQgPT09ICdmdW5jdGlvbicgJiYgcmVjb3JkZXJIaW50cy5taW1lVHlwZSkge1xyXG4gICAgICAgICAgICBpZiAoIU1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkKHJlY29yZGVySGludHMubWltZVR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTWVkaWFSZWNvcmRlciBBUEkgc2VlbXMgdW5hYmxlIHRvIHJlY29yZCBtaW1lVHlwZTonLCByZWNvcmRlckhpbnRzLm1pbWVUeXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZWNvcmRlckhpbnRzLm1pbWVUeXBlID0gY29uZmlnLnR5cGUgPT09ICdhdWRpbycgPyAnYXVkaW8vd2VibScgOiAndmlkZW8vd2VibSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHVzaW5nIE1lZGlhUmVjb3JkZXIgQVBJIGhlcmVcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIobWVkaWFTdHJlYW0sIHJlY29yZGVySGludHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gcmVzZXRcclxuICAgICAgICAgICAgY29uZmlnLm1pbWVUeXBlID0gcmVjb3JkZXJIaW50cy5taW1lVHlwZTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIC8vIGNocm9tZS1iYXNlZCBmYWxsYmFja1xyXG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIobWVkaWFTdHJlYW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gb2xkIGhhY2s/XHJcbiAgICAgICAgaWYgKHJlY29yZGVySGludHMubWltZVR5cGUgJiYgIU1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkICYmICdjYW5SZWNvcmRNaW1lVHlwZScgaW4gbWVkaWFSZWNvcmRlciAmJiBtZWRpYVJlY29yZGVyLmNhblJlY29yZE1pbWVUeXBlKHJlY29yZGVySGludHMubWltZVR5cGUpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdNZWRpYVJlY29yZGVyIEFQSSBzZWVtcyB1bmFibGUgdG8gcmVjb3JkIG1pbWVUeXBlOicsIHJlY29yZGVySGludHMubWltZVR5cGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEaXNwYXRjaGluZyBPbkRhdGFBdmFpbGFibGUgSGFuZGxlclxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBpZiAoZS5kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBhbGxTdGF0ZXMucHVzaCgnb25kYXRhYXZhaWxhYmxlOiAnICsgYnl0ZXNUb1NpemUoZS5kYXRhLnNpemUpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcudGltZVNsaWNlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUuZGF0YSAmJiBlLmRhdGEuc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFycmF5T2ZCbG9icy5wdXNoKGUuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlVGltZVN0YW1wKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9uZGF0YWF2YWlsYWJsZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcnZhbHMgYmFzZWQgYmxvYnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBjb25maWcuZ2V0TmF0aXZlQmxvYiA/IGUuZGF0YSA6IG5ldyBCbG9iKFtlLmRhdGFdLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBnZXRNaW1lVHlwZShyZWNvcmRlckhpbnRzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLm9uZGF0YWF2YWlsYWJsZShibG9iKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghZS5kYXRhIHx8ICFlLmRhdGEuc2l6ZSB8fCBlLmRhdGEuc2l6ZSA8IDEwMCB8fCBzZWxmLmJsb2IpIHtcclxuICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHN0b3BSZWNvcmRpbmcgYWx3YXlzIGdldHRpbmcgZmlyZWRcclxuICAgICAgICAgICAgICAgIC8vIGV2ZW4gaWYgdGhlcmUgaXMgaW52YWxpZCBkYXRhXHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5yZWNvcmRpbmdDYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVjb3JkaW5nQ2FsbGJhY2sobmV3IEJsb2IoW10sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZ2V0TWltZVR5cGUocmVjb3JkZXJIaW50cylcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWNvcmRpbmdDYWxsYmFjayA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuYmxvYiA9IGNvbmZpZy5nZXROYXRpdmVCbG9iID8gZS5kYXRhIDogbmV3IEJsb2IoW2UuZGF0YV0sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IGdldE1pbWVUeXBlKHJlY29yZGVySGludHMpXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGYucmVjb3JkaW5nQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucmVjb3JkaW5nQ2FsbGJhY2soc2VsZi5ibG9iKTtcclxuICAgICAgICAgICAgICAgIHNlbGYucmVjb3JkaW5nQ2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGFsbFN0YXRlcy5wdXNoKCdzdGFydGVkJyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGFsbFN0YXRlcy5wdXNoKCdwYXVzZWQnKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBtZWRpYVJlY29yZGVyLm9ucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGFsbFN0YXRlcy5wdXNoKCdyZXN1bWVkJyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgYWxsU3RhdGVzLnB1c2goJ3N0b3BwZWQnKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBtZWRpYVJlY29yZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xyXG4gICAgICAgICAgICBpZiAoIWVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghZXJyb3IubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgZXJyb3IubmFtZSA9ICdVbmtub3duRXJyb3InO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhbGxTdGF0ZXMucHVzaCgnZXJyb3I6ICcgKyBlcnJvcik7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICAgICAgLy8gdmlhOiBodHRwczovL3czYy5naXRodWIuaW8vbWVkaWFjYXB0dXJlLXJlY29yZC9NZWRpYVJlY29yZGVyLmh0bWwjZXhjZXB0aW9uLXN1bW1hcnlcclxuICAgICAgICAgICAgICAgIGlmIChlcnJvci5uYW1lLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdpbnZhbGlkc3RhdGUnKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUaGUgTWVkaWFSZWNvcmRlciBpcyBub3QgaW4gYSBzdGF0ZSBpbiB3aGljaCB0aGUgcHJvcG9zZWQgb3BlcmF0aW9uIGlzIGFsbG93ZWQgdG8gYmUgZXhlY3V0ZWQuJywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdub3RzdXBwb3J0ZWQnKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdNSU1FIHR5cGUgKCcsIHJlY29yZGVySGludHMubWltZVR5cGUsICcpIGlzIG5vdCBzdXBwb3J0ZWQuJywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdzZWN1cml0eScpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01lZGlhUmVjb3JkZXIgc2VjdXJpdHkgZXJyb3InLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2xkZXIgY29kZSBiZWxvd1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXJyb3IubmFtZSA9PT0gJ091dE9mTWVtb3J5Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBVQSBoYXMgZXhoYXVzZWQgdGhlIGF2YWlsYWJsZSBtZW1vcnkuIFVzZXIgYWdlbnRzIFNIT1VMRCBwcm92aWRlIGFzIG11Y2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhcyBwb3NzaWJsZSBpbiB0aGUgbWVzc2FnZSBhdHRyaWJ1dGUuJywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnSWxsZWdhbFN0cmVhbU1vZGlmaWNhdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBIG1vZGlmaWNhdGlvbiB0byB0aGUgc3RyZWFtIGhhcyBvY2N1cnJlZCB0aGF0IG1ha2VzIGl0IGltcG9zc2libGUgdG8gY29udGludWUgcmVjb3JkaW5nLiBBbiBleGFtcGxlIHdvdWxkIGJlIHRoZSBhZGRpdGlvbiBvZiBhIFRyYWNrIHdoaWxlIHJlY29yZGluZyBpcyBvY2N1cnJpbmcuIFVzZXIgYWdlbnRzIFNIT1VMRCBwcm92aWRlIGFzIG11Y2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhcyBwb3NzaWJsZSBpbiB0aGUgbWVzc2FnZSBhdHRyaWJ1dGUuJywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnT3RoZXJSZWNvcmRpbmdFcnJvcicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdVc2VkIGZvciBhbiBmYXRhbCBlcnJvciBvdGhlciB0aGFuIHRob3NlIGxpc3RlZCBhYm92ZS4gVXNlciBhZ2VudHMgU0hPVUxEIHByb3ZpZGUgYXMgbXVjaCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFzIHBvc3NpYmxlIGluIHRoZSBtZXNzYWdlIGF0dHJpYnV0ZS4nLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLm5hbWUgPT09ICdHZW5lcmljRXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVGhlIFVBIGNhbm5vdCBwcm92aWRlIHRoZSBjb2RlYyBvciByZWNvcmRpbmcgb3B0aW9uIHRoYXQgaGFzIGJlZW4gcmVxdWVzdGVkLicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignTWVkaWFSZWNvcmRlciBFcnJvcicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgKGZ1bmN0aW9uKGxvb3Blcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLm1hbnVhbGx5U3RvcHBlZCAmJiBtZWRpYVJlY29yZGVyICYmIG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdpbmFjdGl2ZScpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY29uZmlnLnRpbWVzbGljZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gMTAgbWludXRlcywgZW5vdWdoP1xyXG4gICAgICAgICAgICAgICAgICAgIG1lZGlhUmVjb3JkZXIuc3RhcnQoMTAgKiA2MCAqIDEwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGxvb3BlciwgMTAwMCk7XHJcbiAgICAgICAgICAgIH0pKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWVkaWFSZWNvcmRlci5zdGF0ZSAhPT0gJ2luYWN0aXZlJyAmJiBtZWRpYVJlY29yZGVyLnN0YXRlICE9PSAnc3RvcHBlZCcpIHtcclxuICAgICAgICAgICAgICAgIG1lZGlhUmVjb3JkZXIuc3RvcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcudGltZVNsaWNlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB1cGRhdGVUaW1lU3RhbXAoKTtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5zdGFydChjb25maWcudGltZVNsaWNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBkZWZhdWx0IGlzIDYwIG1pbnV0ZXM7IGVub3VnaD9cclxuICAgICAgICAgICAgLy8gdXNlIGNvbmZpZyA9PiB7dGltZVNsaWNlOiAxMDAwfSBvdGhlcndpc2VcclxuXHJcbiAgICAgICAgICAgIG1lZGlhUmVjb3JkZXIuc3RhcnQoMy42ZSs2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb25maWcuaW5pdENhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5pbml0Q2FsbGJhY2soKTsgLy8gb2xkIGNvZGVcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheX0gdGltZXN0YW1wcyAtIEFycmF5IG9mIHRpbWUgc3RhbXBzXHJcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGNvbnNvbGUubG9nKHJlY29yZGVyLnRpbWVzdGFtcHMpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnRpbWVzdGFtcHMgPSBbXTtcclxuXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVUaW1lU3RhbXAoKSB7XHJcbiAgICAgICAgc2VsZi50aW1lc3RhbXBzLnB1c2gobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vblRpbWVTdGFtcCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBjb25maWcub25UaW1lU3RhbXAoc2VsZi50aW1lc3RhbXBzW3NlbGYudGltZXN0YW1wcy5sZW5ndGggLSAxXSwgc2VsZi50aW1lc3RhbXBzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0TWltZVR5cGUoc2Vjb25kT2JqZWN0KSB7XHJcbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIgJiYgbWVkaWFSZWNvcmRlci5taW1lVHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWVkaWFSZWNvcmRlci5taW1lVHlwZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzZWNvbmRPYmplY3QubWltZVR5cGUgfHwgJ3ZpZGVvL3dlYm0nO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgcmVjb3JkaW5nIE1lZGlhU3RyZWFtLlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uKCkge307XHJcblxyXG4gICAgICAgIHNlbGYubWFudWFsbHlTdG9wcGVkID0gdHJ1ZTsgLy8gdXNlZCBpbnNpZGUgdGhlIG1lZGlhUmVjb3JkZXIub25lcnJvclxyXG5cclxuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZWNvcmRpbmdDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG5cclxuICAgICAgICBpZiAobWVkaWFSZWNvcmRlci5zdGF0ZSA9PT0gJ3JlY29yZGluZycpIHtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy50aW1lU2xpY2UgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmJsb2IgPSBuZXcgQmxvYihhcnJheU9mQmxvYnMsIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBnZXRNaW1lVHlwZShjb25maWcpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlY29yZGluZ0NhbGxiYWNrKHNlbGYuYmxvYik7XHJcbiAgICAgICAgICAgIH0sIDEwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnBhdXNlKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdyZWNvcmRpbmcnKSB7XHJcbiAgICAgICAgICAgIG1lZGlhUmVjb3JkZXIucGF1c2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnJlc3VtZSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWVkaWFSZWNvcmRlci5zdGF0ZSA9PT0gJ3BhdXNlZCcpIHtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzZXRzIGN1cnJlbnRseSByZWNvcmRlZCBkYXRhLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5jbGVhclJlY29yZGVkRGF0YSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmNsZWFyUmVjb3JkZWREYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIgJiYgbWVkaWFSZWNvcmRlci5zdGF0ZSA9PT0gJ3JlY29yZGluZycpIHtcclxuICAgICAgICAgICAgc2VsZi5zdG9wKGNsZWFyUmVjb3JkZWREYXRhQ0IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2xlYXJSZWNvcmRlZERhdGFDQigpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBjbGVhclJlY29yZGVkRGF0YUNCKCkge1xyXG4gICAgICAgIGFycmF5T2ZCbG9icyA9IFtdO1xyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIgPSBudWxsO1xyXG4gICAgICAgIHNlbGYudGltZXN0YW1wcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlZmVyZW5jZSB0byBcIk1lZGlhUmVjb3JkZXJcIiBvYmplY3RcclxuICAgIHZhciBtZWRpYVJlY29yZGVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWNjZXNzIHRvIG5hdGl2ZSBNZWRpYVJlY29yZGVyIEFQSVxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHZhciBpbnRlcm5hbCA9IHJlY29yZGVyLmdldEludGVybmFsUmVjb3JkZXIoKTtcclxuICAgICAqIGludGVybmFsLm9uZGF0YWF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge307IC8vIG92ZXJyaWRlXHJcbiAgICAgKiBpbnRlcm5hbC5zdHJlYW0sIGludGVybmFsLm9ucGF1c2UsIGludGVybmFsLm9uc3RvcCwgZXRjLlxyXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBpbnRlcm5hbCByZWNvcmRpbmcgb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICB0aGlzLmdldEludGVybmFsUmVjb3JkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbWVkaWFSZWNvcmRlcjtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gaXNNZWRpYVN0cmVhbUFjdGl2ZSgpIHtcclxuICAgICAgICBpZiAoJ2FjdGl2ZScgaW4gbWVkaWFTdHJlYW0pIHtcclxuICAgICAgICAgICAgaWYgKCFtZWRpYVN0cmVhbS5hY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoJ2VuZGVkJyBpbiBtZWRpYVN0cmVhbSkgeyAvLyBvbGQgaGFja1xyXG4gICAgICAgICAgICBpZiAobWVkaWFTdHJlYW0uZW5kZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwcm9wZXJ0eSB7QmxvYn0gYmxvYiAtIFJlY29yZGVkIGRhdGEgYXMgXCJCbG9iXCIgb2JqZWN0LlxyXG4gICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCkge1xyXG4gICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcclxuICAgICAqIH0pO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmJsb2IgPSBudWxsO1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBNZWRpYVJlY29yZGVyIHJlYWRvbmx5IHN0YXRlLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB2YXIgc3RhdGUgPSByZWNvcmRlci5nZXRTdGF0ZSgpO1xyXG4gICAgICogQHJldHVybnMge1N0cmluZ30gUmV0dXJucyByZWNvcmRpbmcgc3RhdGUuXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdpbmFjdGl2ZSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWVkaWFSZWNvcmRlci5zdGF0ZSB8fCAnaW5hY3RpdmUnO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBsaXN0IG9mIGFsbCByZWNvcmRpbmcgc3RhdGVzXHJcbiAgICB2YXIgYWxsU3RhdGVzID0gW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgTWVkaWFSZWNvcmRlciBhbGwgcmVjb3JkaW5nIHN0YXRlcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBNZWRpYVN0cmVhbVJlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdmFyIHN0YXRlID0gcmVjb3JkZXIuZ2V0QWxsU3RhdGVzKCk7XHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYWxsIHJlY29yZGluZyBzdGF0ZXNcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRBbGxTdGF0ZXMgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gYWxsU3RhdGVzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBpZiBhbnkgVHJhY2sgd2l0aGluIHRoZSBNZWRpYVN0cmVhbSBpcyBtdXRlZCBvciBub3QgZW5hYmxlZCBhdCBhbnkgdGltZSwgXHJcbiAgICAvLyB0aGUgYnJvd3NlciB3aWxsIG9ubHkgcmVjb3JkIGJsYWNrIGZyYW1lcyBcclxuICAgIC8vIG9yIHNpbGVuY2Ugc2luY2UgdGhhdCBpcyB0aGUgY29udGVudCBwcm9kdWNlZCBieSB0aGUgVHJhY2tcclxuICAgIC8vIHNvIHdlIG5lZWQgdG8gc3RvcFJlY29yZGluZyBhcyBzb29uIGFzIGFueSBzaW5nbGUgdHJhY2sgZW5kcy5cclxuICAgIGlmICh0eXBlb2YgY29uZmlnLmNoZWNrRm9ySW5hY3RpdmVUcmFja3MgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgY29uZmlnLmNoZWNrRm9ySW5hY3RpdmVUcmFja3MgPSBmYWxzZTsgLy8gZGlzYWJsZSB0byBtaW5pbWl6ZSBDUFUgdXNhZ2VcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgLy8gdGhpcyBtZXRob2QgY2hlY2tzIGlmIG1lZGlhIHN0cmVhbSBpcyBzdG9wcGVkXHJcbiAgICAvLyBvciBpZiBhbnkgdHJhY2sgaXMgZW5kZWQuXHJcbiAgICAoZnVuY3Rpb24gbG9vcGVyKCkge1xyXG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlciB8fCBjb25maWcuY2hlY2tGb3JJbmFjdGl2ZVRyYWNrcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzTWVkaWFTdHJlYW1BY3RpdmUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNZWRpYVN0cmVhbSBzZWVtcyBzdG9wcGVkLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNlbGYuc3RvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGxvb3BlciwgMTAwMCk7IC8vIGNoZWNrIGV2ZXJ5IHNlY29uZFxyXG4gICAgfSkoKTtcclxuXHJcbiAgICAvLyBmb3IgZGVidWdnaW5nXHJcbiAgICB0aGlzLm5hbWUgPSAnTWVkaWFTdHJlYW1SZWNvcmRlcic7XHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgUmVjb3JkUlRDICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgUmVjb3JkUlRDLk1lZGlhU3RyZWFtUmVjb3JkZXIgPSBNZWRpYVN0cmVhbVJlY29yZGVyO1xyXG59XHJcblxyXG4vLyBzb3VyY2UgY29kZSBmcm9tOiBodHRwOi8vdHlwZWRhcnJheS5vcmcvd3AtY29udGVudC9wcm9qZWN0cy9XZWJBdWRpb1JlY29yZGVyL3NjcmlwdC5qc1xyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbWF0dGRpYW1vbmQvUmVjb3JkZXJqcyNsaWNlbnNlLW1pdFxyXG4vLyBfX19fX19fX19fX19fX19fX19fX19fXHJcbi8vIFN0ZXJlb0F1ZGlvUmVjb3JkZXIuanNcclxuXHJcbi8qKlxyXG4gKiBTdGVyZW9BdWRpb1JlY29yZGVyIGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIFwic3RlcmVvXCIgYXVkaW8tcmVjb3JkaW5nIGluIGNocm9tZS5cclxuICogQHN1bW1hcnkgSmF2YVNjcmlwdCBzdGFuZGFsb25lIG9iamVjdCBmb3Igc3RlcmVvIGF1ZGlvIHJlY29yZGluZy5cclxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL0xJQ0VOU0V8TUlUfVxyXG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL011YXpLaGFuLmNvbXxNdWF6IEtoYW59XHJcbiAqIEB0eXBlZGVmIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcclxuICogQGNsYXNzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciByZWNvcmRlciA9IG5ldyBTdGVyZW9BdWRpb1JlY29yZGVyKE1lZGlhU3RyZWFtLCB7XHJcbiAqICAgICBzYW1wbGVSYXRlOiA0NDEwMCxcclxuICogICAgIGJ1ZmZlclNpemU6IDQwOTZcclxuICogfSk7XHJcbiAqIHJlY29yZGVyLnJlY29yZCgpO1xyXG4gKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcclxuICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAqIH0pO1xyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQ3xSZWNvcmRSVEMgU291cmNlIENvZGV9XHJcbiAqIEBwYXJhbSB7TWVkaWFTdHJlYW19IG1lZGlhU3RyZWFtIC0gTWVkaWFTdHJlYW0gb2JqZWN0IGZldGNoZWQgdXNpbmcgZ2V0VXNlck1lZGlhIEFQSSBvciBnZW5lcmF0ZWQgdXNpbmcgY2FwdHVyZVN0cmVhbVVudGlsRW5kZWQgb3IgV2ViQXVkaW8gQVBJLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIC0ge3NhbXBsZVJhdGU6IDQ0MTAwLCBidWZmZXJTaXplOiA0MDk2LCBudW1iZXJPZkF1ZGlvQ2hhbm5lbHM6IDEsIGV0Yy59XHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gU3RlcmVvQXVkaW9SZWNvcmRlcihtZWRpYVN0cmVhbSwgY29uZmlnKSB7XHJcbiAgICBpZiAoIWdldFRyYWNrcyhtZWRpYVN0cmVhbSwgJ2F1ZGlvJykubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhyb3cgJ1lvdXIgc3RyZWFtIGhhcyBubyBhdWRpbyB0cmFja3MuJztcclxuICAgIH1cclxuXHJcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIC8vIHZhcmlhYmxlc1xyXG4gICAgdmFyIGxlZnRjaGFubmVsID0gW107XHJcbiAgICB2YXIgcmlnaHRjaGFubmVsID0gW107XHJcbiAgICB2YXIgcmVjb3JkaW5nID0gZmFsc2U7XHJcbiAgICB2YXIgcmVjb3JkaW5nTGVuZ3RoID0gMDtcclxuICAgIHZhciBqc0F1ZGlvTm9kZTtcclxuXHJcbiAgICB2YXIgbnVtYmVyT2ZBdWRpb0NoYW5uZWxzID0gMjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBzYW1wbGUgcmF0ZXMgc3VjaCBhcyA4SyBvciAxNksuIFJlZmVyZW5jZTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjg5NzcxMzYvNTUyMTgyXHJcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZGVzaXJlZFNhbXBSYXRlIC0gRGVzaXJlZCBCaXRzIHBlciBzYW1wbGUgKiAxMDAwXHJcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdmFyIHJlY29yZGVyID0gU3RlcmVvQXVkaW9SZWNvcmRlcihtZWRpYVN0cmVhbSwge1xyXG4gICAgICogICBkZXNpcmVkU2FtcFJhdGU6IDE2ICogMTAwMCAvLyBiaXRzLXBlci1zYW1wbGUgKiAxMDAwXHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgdmFyIGRlc2lyZWRTYW1wUmF0ZSA9IGNvbmZpZy5kZXNpcmVkU2FtcFJhdGU7XHJcblxyXG4gICAgLy8gYmFja3dhcmQgY29tcGF0aWJpbGl0eVxyXG4gICAgaWYgKGNvbmZpZy5sZWZ0Q2hhbm5lbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIG51bWJlck9mQXVkaW9DaGFubmVscyA9IDE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbmZpZy5udW1iZXJPZkF1ZGlvQ2hhbm5lbHMgPT09IDEpIHtcclxuICAgICAgICBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMgPSAxO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbnVtYmVyT2ZBdWRpb0NoYW5uZWxzIHx8IG51bWJlck9mQXVkaW9DaGFubmVscyA8IDEpIHtcclxuICAgICAgICBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMgPSAyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1N0ZXJlb0F1ZGlvUmVjb3JkZXIgaXMgc2V0IHRvIHJlY29yZCBudW1iZXIgb2YgY2hhbm5lbHM6ICcgKyBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIGFueSBUcmFjayB3aXRoaW4gdGhlIE1lZGlhU3RyZWFtIGlzIG11dGVkIG9yIG5vdCBlbmFibGVkIGF0IGFueSB0aW1lLCBcclxuICAgIC8vIHRoZSBicm93c2VyIHdpbGwgb25seSByZWNvcmQgYmxhY2sgZnJhbWVzIFxyXG4gICAgLy8gb3Igc2lsZW5jZSBzaW5jZSB0aGF0IGlzIHRoZSBjb250ZW50IHByb2R1Y2VkIGJ5IHRoZSBUcmFja1xyXG4gICAgLy8gc28gd2UgbmVlZCB0byBzdG9wUmVjb3JkaW5nIGFzIHNvb24gYXMgYW55IHNpbmdsZSB0cmFjayBlbmRzLlxyXG4gICAgaWYgKHR5cGVvZiBjb25maWcuY2hlY2tGb3JJbmFjdGl2ZVRyYWNrcyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBjb25maWcuY2hlY2tGb3JJbmFjdGl2ZVRyYWNrcyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNNZWRpYVN0cmVhbUFjdGl2ZSgpIHtcclxuICAgICAgICBpZiAoY29uZmlnLmNoZWNrRm9ySW5hY3RpdmVUcmFja3MgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIC8vIGFsd2F5cyByZXR1cm4gXCJ0cnVlXCJcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoJ2FjdGl2ZScgaW4gbWVkaWFTdHJlYW0pIHtcclxuICAgICAgICAgICAgaWYgKCFtZWRpYVN0cmVhbS5hY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoJ2VuZGVkJyBpbiBtZWRpYVN0cmVhbSkgeyAvLyBvbGQgaGFja1xyXG4gICAgICAgICAgICBpZiAobWVkaWFTdHJlYW0uZW5kZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlY29yZHMgTWVkaWFTdHJlYW0uXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnJlY29yZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChpc01lZGlhU3RyZWFtQWN0aXZlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQbGVhc2UgbWFrZSBzdXJlIE1lZGlhU3RyZWFtIGlzIGFjdGl2ZS4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVzZXRWYXJpYWJsZXMoKTtcclxuXHJcbiAgICAgICAgaXNBdWRpb1Byb2Nlc3NTdGFydGVkID0gaXNQYXVzZWQgPSBmYWxzZTtcclxuICAgICAgICByZWNvcmRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy50aW1lU2xpY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIGxvb3BlcigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gbWVyZ2VMZWZ0UmlnaHRCdWZmZXJzKGNvbmZpZywgY2FsbGJhY2spIHtcclxuICAgICAgICBmdW5jdGlvbiBtZXJnZUF1ZGlvQnVmZmVycyhjb25maWcsIGNiKSB7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMgPSBjb25maWcubnVtYmVyT2ZBdWRpb0NoYW5uZWxzO1xyXG5cclxuICAgICAgICAgICAgLy8gdG9kbzogXCJzbGljZSgwKVwiIC0tLSBpcyBpdCBjYXVzZXMgbG9vcD8gU2hvdWxkIGJlIHJlbW92ZWQ/XHJcbiAgICAgICAgICAgIHZhciBsZWZ0QnVmZmVycyA9IGNvbmZpZy5sZWZ0QnVmZmVycy5zbGljZSgwKTtcclxuICAgICAgICAgICAgdmFyIHJpZ2h0QnVmZmVycyA9IGNvbmZpZy5yaWdodEJ1ZmZlcnMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIHZhciBzYW1wbGVSYXRlID0gY29uZmlnLnNhbXBsZVJhdGU7XHJcbiAgICAgICAgICAgIHZhciBpbnRlcm5hbEludGVybGVhdmVkTGVuZ3RoID0gY29uZmlnLmludGVybmFsSW50ZXJsZWF2ZWRMZW5ndGg7XHJcbiAgICAgICAgICAgIHZhciBkZXNpcmVkU2FtcFJhdGUgPSBjb25maWcuZGVzaXJlZFNhbXBSYXRlO1xyXG5cclxuICAgICAgICAgICAgaWYgKG51bWJlck9mQXVkaW9DaGFubmVscyA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgbGVmdEJ1ZmZlcnMgPSBtZXJnZUJ1ZmZlcnMobGVmdEJ1ZmZlcnMsIGludGVybmFsSW50ZXJsZWF2ZWRMZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgcmlnaHRCdWZmZXJzID0gbWVyZ2VCdWZmZXJzKHJpZ2h0QnVmZmVycywgaW50ZXJuYWxJbnRlcmxlYXZlZExlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRlc2lyZWRTYW1wUmF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZnRCdWZmZXJzID0gaW50ZXJwb2xhdGVBcnJheShsZWZ0QnVmZmVycywgZGVzaXJlZFNhbXBSYXRlLCBzYW1wbGVSYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICByaWdodEJ1ZmZlcnMgPSBpbnRlcnBvbGF0ZUFycmF5KHJpZ2h0QnVmZmVycywgZGVzaXJlZFNhbXBSYXRlLCBzYW1wbGVSYXRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG51bWJlck9mQXVkaW9DaGFubmVscyA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgbGVmdEJ1ZmZlcnMgPSBtZXJnZUJ1ZmZlcnMobGVmdEJ1ZmZlcnMsIGludGVybmFsSW50ZXJsZWF2ZWRMZW5ndGgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkZXNpcmVkU2FtcFJhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0QnVmZmVycyA9IGludGVycG9sYXRlQXJyYXkobGVmdEJ1ZmZlcnMsIGRlc2lyZWRTYW1wUmF0ZSwgc2FtcGxlUmF0ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNldCBzYW1wbGUgcmF0ZSBhcyBkZXNpcmVkIHNhbXBsZSByYXRlXHJcbiAgICAgICAgICAgIGlmIChkZXNpcmVkU2FtcFJhdGUpIHtcclxuICAgICAgICAgICAgICAgIHNhbXBsZVJhdGUgPSBkZXNpcmVkU2FtcFJhdGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZvciBjaGFuZ2luZyB0aGUgc2FtcGxpbmcgcmF0ZSwgcmVmZXJlbmNlOlxyXG4gICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yODk3NzEzNi81NTIxODJcclxuICAgICAgICAgICAgZnVuY3Rpb24gaW50ZXJwb2xhdGVBcnJheShkYXRhLCBuZXdTYW1wbGVSYXRlLCBvbGRTYW1wbGVSYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZml0Q291bnQgPSBNYXRoLnJvdW5kKGRhdGEubGVuZ3RoICogKG5ld1NhbXBsZVJhdGUgLyBvbGRTYW1wbGVSYXRlKSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3RGF0YSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNwcmluZ0ZhY3RvciA9IE51bWJlcigoZGF0YS5sZW5ndGggLSAxKSAvIChmaXRDb3VudCAtIDEpKTtcclxuICAgICAgICAgICAgICAgIG5ld0RhdGFbMF0gPSBkYXRhWzBdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBmaXRDb3VudCAtIDE7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXAgPSBpICogc3ByaW5nRmFjdG9yO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiZWZvcmUgPSBOdW1iZXIoTWF0aC5mbG9vcih0bXApKS50b0ZpeGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFmdGVyID0gTnVtYmVyKE1hdGguY2VpbCh0bXApKS50b0ZpeGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0UG9pbnQgPSB0bXAgLSBiZWZvcmU7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RGF0YVtpXSA9IGxpbmVhckludGVycG9sYXRlKGRhdGFbYmVmb3JlXSwgZGF0YVthZnRlcl0sIGF0UG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbmV3RGF0YVtmaXRDb3VudCAtIDFdID0gZGF0YVtkYXRhLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld0RhdGE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGxpbmVhckludGVycG9sYXRlKGJlZm9yZSwgYWZ0ZXIsIGF0UG9pbnQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiZWZvcmUgKyAoYWZ0ZXIgLSBiZWZvcmUpICogYXRQb2ludDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gbWVyZ2VCdWZmZXJzKGNoYW5uZWxCdWZmZXIsIHJMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgRmxvYXQ2NEFycmF5KHJMZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgbG5nID0gY2hhbm5lbEJ1ZmZlci5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsbmc7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBidWZmZXIgPSBjaGFubmVsQnVmZmVyW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zZXQoYnVmZmVyLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSBidWZmZXIubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGludGVybGVhdmUobGVmdENoYW5uZWwsIHJpZ2h0Q2hhbm5lbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGxlZnRDaGFubmVsLmxlbmd0aCArIHJpZ2h0Q2hhbm5lbC5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDY0QXJyYXkobGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXRJbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDspIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaW5kZXgrK10gPSBsZWZ0Q2hhbm5lbFtpbnB1dEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaW5kZXgrK10gPSByaWdodENoYW5uZWxbaW5wdXRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVVVEZCeXRlcyh2aWV3LCBvZmZzZXQsIHN0cmluZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxuZyA9IHN0cmluZy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxuZzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQgKyBpLCBzdHJpbmcuY2hhckNvZGVBdChpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGludGVybGVhdmUgYm90aCBjaGFubmVscyB0b2dldGhlclxyXG4gICAgICAgICAgICB2YXIgaW50ZXJsZWF2ZWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAobnVtYmVyT2ZBdWRpb0NoYW5uZWxzID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpbnRlcmxlYXZlZCA9IGludGVybGVhdmUobGVmdEJ1ZmZlcnMsIHJpZ2h0QnVmZmVycyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChudW1iZXJPZkF1ZGlvQ2hhbm5lbHMgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIGludGVybGVhdmVkID0gbGVmdEJ1ZmZlcnM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpbnRlcmxlYXZlZExlbmd0aCA9IGludGVybGVhdmVkLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZSB3YXYgZmlsZVxyXG4gICAgICAgICAgICB2YXIgcmVzdWx0aW5nQnVmZmVyTGVuZ3RoID0gNDQgKyBpbnRlcmxlYXZlZExlbmd0aCAqIDI7XHJcblxyXG4gICAgICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHJlc3VsdGluZ0J1ZmZlckxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xyXG5cclxuICAgICAgICAgICAgLy8gUklGRiBjaHVuayBkZXNjcmlwdG9yL2lkZW50aWZpZXIgXHJcbiAgICAgICAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgMCwgJ1JJRkYnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJJRkYgY2h1bmsgbGVuZ3RoXHJcbiAgICAgICAgICAgIC8vIGNoYW5nZWQgXCI0NFwiIHRvIFwiMzZcIiB2aWEgIzQwMVxyXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQzMig0LCAzNiArIGludGVybGVhdmVkTGVuZ3RoICogMiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBSSUZGIHR5cGUgXHJcbiAgICAgICAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgOCwgJ1dBVkUnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGZvcm1hdCBjaHVuayBpZGVudGlmaWVyIFxyXG4gICAgICAgICAgICAvLyBGTVQgc3ViLWNodW5rXHJcbiAgICAgICAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgMTIsICdmbXQgJyk7XHJcblxyXG4gICAgICAgICAgICAvLyBmb3JtYXQgY2h1bmsgbGVuZ3RoIFxyXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQzMigxNiwgMTYsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgLy8gc2FtcGxlIGZvcm1hdCAocmF3KVxyXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQxNigyMCwgMSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBzdGVyZW8gKDIgY2hhbm5lbHMpXHJcbiAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDIyLCBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgLy8gc2FtcGxlIHJhdGUgXHJcbiAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKDI0LCBzYW1wbGVSYXRlLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGJ5dGUgcmF0ZSAoc2FtcGxlIHJhdGUgKiBibG9jayBhbGlnbilcclxuICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMjgsIHNhbXBsZVJhdGUgKiBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMgKiAyLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGJsb2NrIGFsaWduIChjaGFubmVsIGNvdW50ICogYnl0ZXMgcGVyIHNhbXBsZSkgXHJcbiAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDMyLCBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMgKiAyLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGJpdHMgcGVyIHNhbXBsZSBcclxuICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMzQsIDE2LCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRhdGEgc3ViLWNodW5rXHJcbiAgICAgICAgICAgIC8vIGRhdGEgY2h1bmsgaWRlbnRpZmllciBcclxuICAgICAgICAgICAgd3JpdGVVVEZCeXRlcyh2aWV3LCAzNiwgJ2RhdGEnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRhdGEgY2h1bmsgbGVuZ3RoIFxyXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQzMig0MCwgaW50ZXJsZWF2ZWRMZW5ndGggKiAyLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHdyaXRlIHRoZSBQQ00gc2FtcGxlc1xyXG4gICAgICAgICAgICB2YXIgbG5nID0gaW50ZXJsZWF2ZWRMZW5ndGg7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IDQ0O1xyXG4gICAgICAgICAgICB2YXIgdm9sdW1lID0gMTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsbmc7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmlldy5zZXRJbnQxNihpbmRleCwgaW50ZXJsZWF2ZWRbaV0gKiAoMHg3RkZGICogdm9sdW1lKSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY2IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYih7XHJcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiBidWZmZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlldzogdmlld1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcjogYnVmZmVyLFxyXG4gICAgICAgICAgICAgICAgdmlldzogdmlld1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb25maWcubm9Xb3JrZXIpIHtcclxuICAgICAgICAgICAgbWVyZ2VBdWRpb0J1ZmZlcnMoY29uZmlnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLmJ1ZmZlciwgZGF0YS52aWV3KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB2YXIgd2ViV29ya2VyID0gcHJvY2Vzc0luV2ViV29ya2VyKG1lcmdlQXVkaW9CdWZmZXJzKTtcclxuXHJcbiAgICAgICAgd2ViV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50LmRhdGEuYnVmZmVyLCBldmVudC5kYXRhLnZpZXcpO1xyXG5cclxuICAgICAgICAgICAgLy8gcmVsZWFzZSBtZW1vcnlcclxuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh3ZWJXb3JrZXIud29ya2VyVVJMKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGtpbGwgd2Vid29ya2VyIChvciBDaHJvbWUgd2lsbCBraWxsIHlvdXIgcGFnZSBhZnRlciB+MjUgY2FsbHMpXHJcbiAgICAgICAgICAgIHdlYldvcmtlci50ZXJtaW5hdGUoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB3ZWJXb3JrZXIucG9zdE1lc3NhZ2UoY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwcm9jZXNzSW5XZWJXb3JrZXIoX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgdmFyIHdvcmtlclVSTCA9IFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW19mdW5jdGlvbi50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAnO3RoaXMub25tZXNzYWdlID0gIGZ1bmN0aW9uIChlZWUpIHsnICsgX2Z1bmN0aW9uLm5hbWUgKyAnKGVlZS5kYXRhKTt9J1xyXG4gICAgICAgIF0sIHtcclxuICAgICAgICAgICAgdHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB2YXIgd29ya2VyID0gbmV3IFdvcmtlcih3b3JrZXJVUkwpO1xyXG4gICAgICAgIHdvcmtlci53b3JrZXJVUkwgPSB3b3JrZXJVUkw7XHJcbiAgICAgICAgcmV0dXJuIHdvcmtlcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHN0b3BzIHJlY29yZGluZyBNZWRpYVN0cmVhbS5cclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24sIHRoYXQgaXMgdXNlZCB0byBwYXNzIHJlY29yZGVkIGJsb2IgYmFjayB0byB0aGUgY2FsbGVlLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcclxuICAgICAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICogfSk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xyXG5cclxuICAgICAgICAvLyBzdG9wIHJlY29yZGluZ1xyXG4gICAgICAgIHJlY29yZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBtZXJnZUxlZnRSaWdodEJ1ZmZlcnMoe1xyXG4gICAgICAgICAgICBkZXNpcmVkU2FtcFJhdGU6IGRlc2lyZWRTYW1wUmF0ZSxcclxuICAgICAgICAgICAgc2FtcGxlUmF0ZTogc2FtcGxlUmF0ZSxcclxuICAgICAgICAgICAgbnVtYmVyT2ZBdWRpb0NoYW5uZWxzOiBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMsXHJcbiAgICAgICAgICAgIGludGVybmFsSW50ZXJsZWF2ZWRMZW5ndGg6IHJlY29yZGluZ0xlbmd0aCxcclxuICAgICAgICAgICAgbGVmdEJ1ZmZlcnM6IGxlZnRjaGFubmVsLFxyXG4gICAgICAgICAgICByaWdodEJ1ZmZlcnM6IG51bWJlck9mQXVkaW9DaGFubmVscyA9PT0gMSA/IFtdIDogcmlnaHRjaGFubmVsLFxyXG4gICAgICAgICAgICBub1dvcmtlcjogY29uZmlnLm5vV29ya2VyXHJcbiAgICAgICAgfSwgZnVuY3Rpb24oYnVmZmVyLCB2aWV3KSB7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jsb2J9IGJsb2IgLSBUaGUgcmVjb3JkZWQgYmxvYiBvYmplY3QuXHJcbiAgICAgICAgICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXHJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcclxuICAgICAgICAgICAgICogfSk7XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBzZWxmLmJsb2IgPSBuZXcgQmxvYihbdmlld10sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdhdWRpby93YXYnXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7QXJyYXlCdWZmZXJ9IGJ1ZmZlciAtIFRoZSByZWNvcmRlZCBidWZmZXIgb2JqZWN0LlxyXG4gICAgICAgICAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAqICAgICB2YXIgYnVmZmVyID0gcmVjb3JkZXIuYnVmZmVyO1xyXG4gICAgICAgICAgICAgKiB9KTtcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNlbGYuYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHZpZXcuYnVmZmVyLmJ5dGVMZW5ndGgpO1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7RGF0YVZpZXd9IHZpZXcgLSBUaGUgcmVjb3JkZWQgZGF0YS12aWV3IG9iamVjdC5cclxuICAgICAgICAgICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcclxuICAgICAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgKiAgICAgdmFyIHZpZXcgPSByZWNvcmRlci52aWV3O1xyXG4gICAgICAgICAgICAgKiB9KTtcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNlbGYudmlldyA9IHZpZXc7XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhbXBsZVJhdGUgPSBkZXNpcmVkU2FtcFJhdGUgfHwgc2FtcGxlUmF0ZTtcclxuICAgICAgICAgICAgc2VsZi5idWZmZXJTaXplID0gYnVmZmVyU2l6ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIHJlY29yZGVkIGF1ZGlvIGxlbmd0aFxyXG4gICAgICAgICAgICBzZWxmLmxlbmd0aCA9IHJlY29yZGluZ0xlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIGlzQXVkaW9Qcm9jZXNzU3RhcnRlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhzZWxmLmJsb2IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0eXBlb2YgUmVjb3JkUlRDLlN0b3JhZ2UgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgUmVjb3JkUlRDLlN0b3JhZ2UgPSB7XHJcbiAgICAgICAgICAgIEF1ZGlvQ29udGV4dENvbnN0cnVjdG9yOiBudWxsLFxyXG4gICAgICAgICAgICBBdWRpb0NvbnRleHQ6IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFSZWNvcmRSVEMuU3RvcmFnZS5BdWRpb0NvbnRleHRDb25zdHJ1Y3RvciB8fCBSZWNvcmRSVEMuU3RvcmFnZS5BdWRpb0NvbnRleHRDb25zdHJ1Y3Rvci5zdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcclxuICAgICAgICBSZWNvcmRSVEMuU3RvcmFnZS5BdWRpb0NvbnRleHRDb25zdHJ1Y3RvciA9IG5ldyBSZWNvcmRSVEMuU3RvcmFnZS5BdWRpb0NvbnRleHQoKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29udGV4dCA9IFJlY29yZFJUQy5TdG9yYWdlLkF1ZGlvQ29udGV4dENvbnN0cnVjdG9yO1xyXG5cclxuICAgIC8vIGNyZWF0ZXMgYW4gYXVkaW8gbm9kZSBmcm9tIHRoZSBtaWNyb3Bob25lIGluY29taW5nIHN0cmVhbVxyXG4gICAgdmFyIGF1ZGlvSW5wdXQgPSBjb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKG1lZGlhU3RyZWFtKTtcclxuXHJcbiAgICB2YXIgbGVnYWxCdWZmZXJWYWx1ZXMgPSBbMCwgMjU2LCA1MTIsIDEwMjQsIDIwNDgsIDQwOTYsIDgxOTIsIDE2Mzg0XTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZyb20gdGhlIHNwZWM6IFRoaXMgdmFsdWUgY29udHJvbHMgaG93IGZyZXF1ZW50bHkgdGhlIGF1ZGlvcHJvY2VzcyBldmVudCBpc1xyXG4gICAgICogZGlzcGF0Y2hlZCBhbmQgaG93IG1hbnkgc2FtcGxlLWZyYW1lcyBuZWVkIHRvIGJlIHByb2Nlc3NlZCBlYWNoIGNhbGwuXHJcbiAgICAgKiBMb3dlciB2YWx1ZXMgZm9yIGJ1ZmZlciBzaXplIHdpbGwgcmVzdWx0IGluIGEgbG93ZXIgKGJldHRlcikgbGF0ZW5jeS5cclxuICAgICAqIEhpZ2hlciB2YWx1ZXMgd2lsbCBiZSBuZWNlc3NhcnkgdG8gYXZvaWQgYXVkaW8gYnJlYWt1cCBhbmQgZ2xpdGNoZXNcclxuICAgICAqIFRoZSBzaXplIG9mIHRoZSBidWZmZXIgKGluIHNhbXBsZS1mcmFtZXMpIHdoaWNoIG5lZWRzIHRvXHJcbiAgICAgKiBiZSBwcm9jZXNzZWQgZWFjaCB0aW1lIG9ucHJvY2Vzc2F1ZGlvIGlzIGNhbGxlZC5cclxuICAgICAqIExlZ2FsIHZhbHVlcyBhcmUgKDI1NiwgNTEyLCAxMDI0LCAyMDQ4LCA0MDk2LCA4MTkyLCAxNjM4NCkuXHJcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gYnVmZmVyU2l6ZSAtIEJ1ZmZlci1zaXplIGZvciBob3cgZnJlcXVlbnRseSB0aGUgYXVkaW9wcm9jZXNzIGV2ZW50IGlzIGRpc3BhdGNoZWQuXHJcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyID0gbmV3IFN0ZXJlb0F1ZGlvUmVjb3JkZXIobWVkaWFTdHJlYW0sIHtcclxuICAgICAqICAgICBidWZmZXJTaXplOiA0MDk2XHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG5cclxuICAgIC8vIFwiMFwiIG1lYW5zLCBsZXQgY2hyb21lIGRlY2lkZSB0aGUgbW9zdCBhY2N1cmF0ZSBidWZmZXItc2l6ZSBmb3IgY3VycmVudCBwbGF0Zm9ybS5cclxuICAgIHZhciBidWZmZXJTaXplID0gdHlwZW9mIGNvbmZpZy5idWZmZXJTaXplID09PSAndW5kZWZpbmVkJyA/IDQwOTYgOiBjb25maWcuYnVmZmVyU2l6ZTtcclxuXHJcbiAgICBpZiAobGVnYWxCdWZmZXJWYWx1ZXMuaW5kZXhPZihidWZmZXJTaXplKSA9PT0gLTEpIHtcclxuICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTGVnYWwgdmFsdWVzIGZvciBidWZmZXItc2l6ZSBhcmUgJyArIEpTT04uc3RyaW5naWZ5KGxlZ2FsQnVmZmVyVmFsdWVzLCBudWxsLCAnXFx0JykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29udGV4dC5jcmVhdGVKYXZhU2NyaXB0Tm9kZSkge1xyXG4gICAgICAgIGpzQXVkaW9Ob2RlID0gY29udGV4dC5jcmVhdGVKYXZhU2NyaXB0Tm9kZShidWZmZXJTaXplLCBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMsIG51bWJlck9mQXVkaW9DaGFubmVscyk7XHJcbiAgICB9IGVsc2UgaWYgKGNvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKSB7XHJcbiAgICAgICAganNBdWRpb05vZGUgPSBjb250ZXh0LmNyZWF0ZVNjcmlwdFByb2Nlc3NvcihidWZmZXJTaXplLCBudW1iZXJPZkF1ZGlvQ2hhbm5lbHMsIG51bWJlck9mQXVkaW9DaGFubmVscyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93ICdXZWJBdWRpbyBBUEkgaGFzIG5vIHN1cHBvcnQgb24gdGhpcyBicm93c2VyLic7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29ubmVjdCB0aGUgc3RyZWFtIHRvIHRoZSBzY3JpcHQgcHJvY2Vzc29yXHJcbiAgICBhdWRpb0lucHV0LmNvbm5lY3QoanNBdWRpb05vZGUpO1xyXG5cclxuICAgIGlmICghY29uZmlnLmJ1ZmZlclNpemUpIHtcclxuICAgICAgICBidWZmZXJTaXplID0ganNBdWRpb05vZGUuYnVmZmVyU2l6ZTsgLy8gZGV2aWNlIGJ1ZmZlci1zaXplXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgc2FtcGxlIHJhdGUgKGluIHNhbXBsZS1mcmFtZXMgcGVyIHNlY29uZCkgYXQgd2hpY2ggdGhlXHJcbiAgICAgKiBBdWRpb0NvbnRleHQgaGFuZGxlcyBhdWRpby4gSXQgaXMgYXNzdW1lZCB0aGF0IGFsbCBBdWRpb05vZGVzXHJcbiAgICAgKiBpbiB0aGUgY29udGV4dCBydW4gYXQgdGhpcyByYXRlLiBJbiBtYWtpbmcgdGhpcyBhc3N1bXB0aW9uLFxyXG4gICAgICogc2FtcGxlLXJhdGUgY29udmVydGVycyBvciBcInZhcmlzcGVlZFwiIHByb2Nlc3NvcnMgYXJlIG5vdCBzdXBwb3J0ZWRcclxuICAgICAqIGluIHJlYWwtdGltZSBwcm9jZXNzaW5nLlxyXG4gICAgICogVGhlIHNhbXBsZVJhdGUgcGFyYW1ldGVyIGRlc2NyaWJlcyB0aGUgc2FtcGxlLXJhdGUgb2YgdGhlXHJcbiAgICAgKiBsaW5lYXIgUENNIGF1ZGlvIGRhdGEgaW4gdGhlIGJ1ZmZlciBpbiBzYW1wbGUtZnJhbWVzIHBlciBzZWNvbmQuXHJcbiAgICAgKiBBbiBpbXBsZW1lbnRhdGlvbiBtdXN0IHN1cHBvcnQgc2FtcGxlLXJhdGVzIGluIGF0IGxlYXN0XHJcbiAgICAgKiB0aGUgcmFuZ2UgMjIwNTAgdG8gOTYwMDAuXHJcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gc2FtcGxlUmF0ZSAtIEJ1ZmZlci1zaXplIGZvciBob3cgZnJlcXVlbnRseSB0aGUgYXVkaW9wcm9jZXNzIGV2ZW50IGlzIGRpc3BhdGNoZWQuXHJcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyID0gbmV3IFN0ZXJlb0F1ZGlvUmVjb3JkZXIobWVkaWFTdHJlYW0sIHtcclxuICAgICAqICAgICBzYW1wbGVSYXRlOiA0NDEwMFxyXG4gICAgICogfSk7XHJcbiAgICAgKi9cclxuICAgIHZhciBzYW1wbGVSYXRlID0gdHlwZW9mIGNvbmZpZy5zYW1wbGVSYXRlICE9PSAndW5kZWZpbmVkJyA/IGNvbmZpZy5zYW1wbGVSYXRlIDogY29udGV4dC5zYW1wbGVSYXRlIHx8IDQ0MTAwO1xyXG5cclxuICAgIGlmIChzYW1wbGVSYXRlIDwgMjIwNTAgfHwgc2FtcGxlUmF0ZSA+IDk2MDAwKSB7XHJcbiAgICAgICAgLy8gUmVmOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNjMwMzkxOC81NTIxODJcclxuICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2FtcGxlLXJhdGUgbXVzdCBiZSB1bmRlciByYW5nZSAyMjA1MCBhbmQgOTYwMDAuJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgaWYgKGNvbmZpZy5kZXNpcmVkU2FtcFJhdGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Rlc2lyZWQgc2FtcGxlLXJhdGU6ICcgKyBjb25maWcuZGVzaXJlZFNhbXBSYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGlzUGF1c2VkID0gZmFsc2U7XHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnBhdXNlKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpc1BhdXNlZCA9IHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnJlc3VtZSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChpc01lZGlhU3RyZWFtQWN0aXZlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQbGVhc2UgbWFrZSBzdXJlIE1lZGlhU3RyZWFtIGlzIGFjdGl2ZS4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFyZWNvcmRpbmcpIHtcclxuICAgICAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZWVtcyByZWNvcmRpbmcgaGFzIGJlZW4gcmVzdGFydGVkLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucmVjb3JkKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlzUGF1c2VkID0gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzZXRzIGN1cnJlbnRseSByZWNvcmRlZCBkYXRhLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5jbGVhclJlY29yZGVkRGF0YSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmNsZWFyUmVjb3JkZWREYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uZmlnLmNoZWNrRm9ySW5hY3RpdmVUcmFja3MgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHJlY29yZGluZykge1xyXG4gICAgICAgICAgICB0aGlzLnN0b3AoY2xlYXJSZWNvcmRlZERhdGFDQik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjbGVhclJlY29yZGVkRGF0YUNCKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlc2V0VmFyaWFibGVzKCkge1xyXG4gICAgICAgIGxlZnRjaGFubmVsID0gW107XHJcbiAgICAgICAgcmlnaHRjaGFubmVsID0gW107XHJcbiAgICAgICAgcmVjb3JkaW5nTGVuZ3RoID0gMDtcclxuICAgICAgICBpc0F1ZGlvUHJvY2Vzc1N0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICByZWNvcmRpbmcgPSBmYWxzZTtcclxuICAgICAgICBpc1BhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnRleHQgPSBudWxsO1xyXG5cclxuICAgICAgICBzZWxmLmxlZnRjaGFubmVsID0gbGVmdGNoYW5uZWw7XHJcbiAgICAgICAgc2VsZi5yaWdodGNoYW5uZWwgPSByaWdodGNoYW5uZWw7XHJcbiAgICAgICAgc2VsZi5udW1iZXJPZkF1ZGlvQ2hhbm5lbHMgPSBudW1iZXJPZkF1ZGlvQ2hhbm5lbHM7XHJcbiAgICAgICAgc2VsZi5kZXNpcmVkU2FtcFJhdGUgPSBkZXNpcmVkU2FtcFJhdGU7XHJcbiAgICAgICAgc2VsZi5zYW1wbGVSYXRlID0gc2FtcGxlUmF0ZTtcclxuICAgICAgICBzZWxmLnJlY29yZGluZ0xlbmd0aCA9IHJlY29yZGluZ0xlbmd0aDtcclxuXHJcbiAgICAgICAgaW50ZXJ2YWxzQmFzZWRCdWZmZXJzID0ge1xyXG4gICAgICAgICAgICBsZWZ0OiBbXSxcclxuICAgICAgICAgICAgcmlnaHQ6IFtdLFxyXG4gICAgICAgICAgICByZWNvcmRpbmdMZW5ndGg6IDBcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNsZWFyUmVjb3JkZWREYXRhQ0IoKSB7XHJcbiAgICAgICAgaWYgKGpzQXVkaW9Ob2RlKSB7XHJcbiAgICAgICAgICAgIGpzQXVkaW9Ob2RlLm9uYXVkaW9wcm9jZXNzID0gbnVsbDtcclxuICAgICAgICAgICAganNBdWRpb05vZGUuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICBqc0F1ZGlvTm9kZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXVkaW9JbnB1dCkge1xyXG4gICAgICAgICAgICBhdWRpb0lucHV0LmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgYXVkaW9JbnB1dCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXNldFZhcmlhYmxlcygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZvciBkZWJ1Z2dpbmdcclxuICAgIHRoaXMubmFtZSA9ICdTdGVyZW9BdWRpb1JlY29yZGVyJztcclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgaXNBdWRpb1Byb2Nlc3NTdGFydGVkID0gZmFsc2U7XHJcblxyXG4gICAgZnVuY3Rpb24gb25BdWRpb1Byb2Nlc3NEYXRhQXZhaWxhYmxlKGUpIHtcclxuICAgICAgICBpZiAoaXNQYXVzZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzTWVkaWFTdHJlYW1BY3RpdmUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNZWRpYVN0cmVhbSBzZWVtcyBzdG9wcGVkLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGpzQXVkaW9Ob2RlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgcmVjb3JkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXJlY29yZGluZykge1xyXG4gICAgICAgICAgICBpZiAoYXVkaW9JbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgYXVkaW9JbnB1dC5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICBhdWRpb0lucHV0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gXCJvbmF1ZGlvcHJvY2Vzc1wiIGV2ZW50J3MgZmlyc3QgaW52b2NhdGlvbi5cclxuICAgICAgICAgKiBAbWV0aG9kIHtmdW5jdGlvbn0gb25BdWRpb1Byb2Nlc3NTdGFydGVkXHJcbiAgICAgICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHJlY29yZGVyLm9uQXVkaW9Qcm9jZXNzU3RhcnRlZDogZnVuY3Rpb24oKSB7IH07XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaWYgKCFpc0F1ZGlvUHJvY2Vzc1N0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgaXNBdWRpb1Byb2Nlc3NTdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5pbml0Q2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5pbml0Q2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGxlZnQgPSBlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xyXG5cclxuICAgICAgICAvLyB3ZSBjbG9uZSB0aGUgc2FtcGxlc1xyXG4gICAgICAgIHZhciBjaExlZnQgPSBuZXcgRmxvYXQzMkFycmF5KGxlZnQpO1xyXG4gICAgICAgIGxlZnRjaGFubmVsLnB1c2goY2hMZWZ0KTtcclxuXHJcbiAgICAgICAgaWYgKG51bWJlck9mQXVkaW9DaGFubmVscyA9PT0gMikge1xyXG4gICAgICAgICAgICB2YXIgcmlnaHQgPSBlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDEpO1xyXG4gICAgICAgICAgICB2YXIgY2hSaWdodCA9IG5ldyBGbG9hdDMyQXJyYXkocmlnaHQpO1xyXG4gICAgICAgICAgICByaWdodGNoYW5uZWwucHVzaChjaFJpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlY29yZGluZ0xlbmd0aCArPSBidWZmZXJTaXplO1xyXG5cclxuICAgICAgICAvLyBleHBvcnQgcmF3IFBDTVxyXG4gICAgICAgIHNlbGYucmVjb3JkaW5nTGVuZ3RoID0gcmVjb3JkaW5nTGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy50aW1lU2xpY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIGludGVydmFsc0Jhc2VkQnVmZmVycy5yZWNvcmRpbmdMZW5ndGggKz0gYnVmZmVyU2l6ZTtcclxuICAgICAgICAgICAgaW50ZXJ2YWxzQmFzZWRCdWZmZXJzLmxlZnQucHVzaChjaExlZnQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG51bWJlck9mQXVkaW9DaGFubmVscyA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWxzQmFzZWRCdWZmZXJzLnJpZ2h0LnB1c2goY2hSaWdodCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAganNBdWRpb05vZGUub25hdWRpb3Byb2Nlc3MgPSBvbkF1ZGlvUHJvY2Vzc0RhdGFBdmFpbGFibGU7XHJcblxyXG4gICAgLy8gdG8gcHJldmVudCBzZWxmIGF1ZGlvIHRvIGJlIGNvbm5lY3RlZCB3aXRoIHNwZWFrZXJzXHJcbiAgICBpZiAoY29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbURlc3RpbmF0aW9uKSB7XHJcbiAgICAgICAganNBdWRpb05vZGUuY29ubmVjdChjb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtRGVzdGluYXRpb24oKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGpzQXVkaW9Ob2RlLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZXhwb3J0IHJhdyBQQ01cclxuICAgIHRoaXMubGVmdGNoYW5uZWwgPSBsZWZ0Y2hhbm5lbDtcclxuICAgIHRoaXMucmlnaHRjaGFubmVsID0gcmlnaHRjaGFubmVsO1xyXG4gICAgdGhpcy5udW1iZXJPZkF1ZGlvQ2hhbm5lbHMgPSBudW1iZXJPZkF1ZGlvQ2hhbm5lbHM7XHJcbiAgICB0aGlzLmRlc2lyZWRTYW1wUmF0ZSA9IGRlc2lyZWRTYW1wUmF0ZTtcclxuICAgIHRoaXMuc2FtcGxlUmF0ZSA9IHNhbXBsZVJhdGU7XHJcbiAgICBzZWxmLnJlY29yZGluZ0xlbmd0aCA9IHJlY29yZGluZ0xlbmd0aDtcclxuXHJcbiAgICAvLyBoZWxwZXIgZm9yIGludGVydmFscyBiYXNlZCBibG9ic1xyXG4gICAgdmFyIGludGVydmFsc0Jhc2VkQnVmZmVycyA9IHtcclxuICAgICAgICBsZWZ0OiBbXSxcclxuICAgICAgICByaWdodDogW10sXHJcbiAgICAgICAgcmVjb3JkaW5nTGVuZ3RoOiAwXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHRoaXMgbG9vcGVyIGlzIHVzZWQgdG8gc3VwcG9ydCBpbnRlcnZhbHMgYmFzZWQgYmxvYnMgKHZpYSB0aW1lU2xpY2Urb25kYXRhYXZhaWxhYmxlKVxyXG4gICAgZnVuY3Rpb24gbG9vcGVyKCkge1xyXG4gICAgICAgIGlmICghcmVjb3JkaW5nIHx8IHR5cGVvZiBjb25maWcub25kYXRhYXZhaWxhYmxlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBjb25maWcudGltZVNsaWNlID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW50ZXJ2YWxzQmFzZWRCdWZmZXJzLmxlZnQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG1lcmdlTGVmdFJpZ2h0QnVmZmVycyh7XHJcbiAgICAgICAgICAgICAgICBkZXNpcmVkU2FtcFJhdGU6IGRlc2lyZWRTYW1wUmF0ZSxcclxuICAgICAgICAgICAgICAgIHNhbXBsZVJhdGU6IHNhbXBsZVJhdGUsXHJcbiAgICAgICAgICAgICAgICBudW1iZXJPZkF1ZGlvQ2hhbm5lbHM6IG51bWJlck9mQXVkaW9DaGFubmVscyxcclxuICAgICAgICAgICAgICAgIGludGVybmFsSW50ZXJsZWF2ZWRMZW5ndGg6IGludGVydmFsc0Jhc2VkQnVmZmVycy5yZWNvcmRpbmdMZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBsZWZ0QnVmZmVyczogaW50ZXJ2YWxzQmFzZWRCdWZmZXJzLmxlZnQsXHJcbiAgICAgICAgICAgICAgICByaWdodEJ1ZmZlcnM6IG51bWJlck9mQXVkaW9DaGFubmVscyA9PT0gMSA/IFtdIDogaW50ZXJ2YWxzQmFzZWRCdWZmZXJzLnJpZ2h0XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGJ1ZmZlciwgdmlldykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbdmlld10sIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXVkaW8vd2F2J1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25maWcub25kYXRhYXZhaWxhYmxlKGJsb2IpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQobG9vcGVyLCBjb25maWcudGltZVNsaWNlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpbnRlcnZhbHNCYXNlZEJ1ZmZlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBbXSxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiBbXSxcclxuICAgICAgICAgICAgICAgIHJlY29yZGluZ0xlbmd0aDogMFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQobG9vcGVyLCBjb25maWcudGltZVNsaWNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgUmVjb3JkUlRDICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgUmVjb3JkUlRDLlN0ZXJlb0F1ZGlvUmVjb3JkZXIgPSBTdGVyZW9BdWRpb1JlY29yZGVyO1xyXG59XHJcblxyXG4vLyBfX19fX19fX19fX19fX19fX1xyXG4vLyBDYW52YXNSZWNvcmRlci5qc1xyXG5cclxuLyoqXHJcbiAqIENhbnZhc1JlY29yZGVyIGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIEhUTUw1LUNhbnZhcyByZWNvcmRpbmcgaW50byB2aWRlbyBXZWJNLiBJdCB1c2VzIEhUTUwyQ2FudmFzIGxpYnJhcnkgYW5kIHJ1bnMgdG9wIG92ZXIge0BsaW5rIFdoYW1teX0uXHJcbiAqIEBzdW1tYXJ5IEhUTUwyQ2FudmFzIHJlY29yZGluZyBpbnRvIHZpZGVvIFdlYk0uXHJcbiAqIEBsaWNlbnNlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQy9ibG9iL21hc3Rlci9MSUNFTlNFfE1JVH1cclxuICogQGF1dGhvciB7QGxpbmsgaHR0cHM6Ly9NdWF6S2hhbi5jb218TXVheiBLaGFufVxyXG4gKiBAdHlwZWRlZiBDYW52YXNSZWNvcmRlclxyXG4gKiBAY2xhc3NcclxuICogQGV4YW1wbGVcclxuICogdmFyIHJlY29yZGVyID0gbmV3IENhbnZhc1JlY29yZGVyKGh0bWxFbGVtZW50LCB7IGRpc2FibGVMb2dzOiB0cnVlLCB1c2VXaGFtbXlSZWNvcmRlcjogdHJ1ZSB9KTtcclxuICogcmVjb3JkZXIucmVjb3JkKCk7XHJcbiAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICogfSk7XHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaHRtbEVsZW1lbnQgLSBxdWVyeVNlbGVjdG9yL2dldEVsZW1lbnRCeUlkL2dldEVsZW1lbnRzQnlUYWdOYW1lWzBdL2V0Yy5cclxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyAtIHtkaXNhYmxlTG9nczp0cnVlLCBpbml0Q2FsbGJhY2s6IGZ1bmN0aW9ufVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIENhbnZhc1JlY29yZGVyKGh0bWxFbGVtZW50LCBjb25maWcpIHtcclxuICAgIGlmICh0eXBlb2YgaHRtbDJjYW52YXMgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgdGhyb3cgJ1BsZWFzZSBsaW5rOiBodHRwczovL3d3dy53ZWJydGMtZXhwZXJpbWVudC5jb20vc2NyZWVuc2hvdC5qcyc7XHJcbiAgICB9XHJcblxyXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG4gICAgaWYgKCFjb25maWcuZnJhbWVJbnRlcnZhbCkge1xyXG4gICAgICAgIGNvbmZpZy5mcmFtZUludGVydmFsID0gMTA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdmlhIERldGVjdFJUQy5qc1xyXG4gICAgdmFyIGlzQ2FudmFzU3VwcG9ydHNTdHJlYW1DYXB0dXJpbmcgPSBmYWxzZTtcclxuICAgIFsnY2FwdHVyZVN0cmVhbScsICdtb3pDYXB0dXJlU3RyZWFtJywgJ3dlYmtpdENhcHR1cmVTdHJlYW0nXS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICBpZiAoaXRlbSBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSkge1xyXG4gICAgICAgICAgICBpc0NhbnZhc1N1cHBvcnRzU3RyZWFtQ2FwdHVyaW5nID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgX2lzQ2hyb21lID0gKCEhd2luZG93LndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uIHx8ICEhd2luZG93LndlYmtpdEdldFVzZXJNZWRpYSkgJiYgISF3aW5kb3cuY2hyb21lO1xyXG5cclxuICAgIHZhciBjaHJvbWVWZXJzaW9uID0gNTA7XHJcbiAgICB2YXIgbWF0Y2hBcnJheSA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0Nocm9tKGV8aXVtKVxcLyhbMC05XSspXFwuLyk7XHJcbiAgICBpZiAoX2lzQ2hyb21lICYmIG1hdGNoQXJyYXkgJiYgbWF0Y2hBcnJheVsyXSkge1xyXG4gICAgICAgIGNocm9tZVZlcnNpb24gPSBwYXJzZUludChtYXRjaEFycmF5WzJdLCAxMCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF9pc0Nocm9tZSAmJiBjaHJvbWVWZXJzaW9uIDwgNTIpIHtcclxuICAgICAgICBpc0NhbnZhc1N1cHBvcnRzU3RyZWFtQ2FwdHVyaW5nID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbmZpZy51c2VXaGFtbXlSZWNvcmRlcikge1xyXG4gICAgICAgIGlzQ2FudmFzU3VwcG9ydHNTdHJlYW1DYXB0dXJpbmcgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZ2xvYmFsQ2FudmFzLCBtZWRpYVN0cmVhbVJlY29yZGVyO1xyXG5cclxuICAgIGlmIChpc0NhbnZhc1N1cHBvcnRzU3RyZWFtQ2FwdHVyaW5nKSB7XHJcbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1lvdXIgYnJvd3NlciBzdXBwb3J0cyBib3RoIE1lZGlSZWNvcmRlciBBUEkgYW5kIGNhbnZhcy5jYXB0dXJlU3RyZWFtIScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGh0bWxFbGVtZW50IGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcclxuICAgICAgICAgICAgZ2xvYmFsQ2FudmFzID0gaHRtbEVsZW1lbnQ7XHJcbiAgICAgICAgfSBlbHNlIGlmIChodG1sRWxlbWVudCBpbnN0YW5jZW9mIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgICAgICBnbG9iYWxDYW52YXMgPSBodG1sRWxlbWVudC5jYW52YXM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1BsZWFzZSBwYXNzIGVpdGhlciBIVE1MQ2FudmFzRWxlbWVudCBvciBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuJztcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKCEhbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSkge1xyXG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NhbnZhcyByZWNvcmRpbmcgaXMgTk9UIHN1cHBvcnRlZCBpbiBGaXJlZm94LicpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgaXNSZWNvcmRpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCByZWNvcmRzIENhbnZhcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBDYW52YXNSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnJlY29yZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlzUmVjb3JkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKGlzQ2FudmFzU3VwcG9ydHNTdHJlYW1DYXB0dXJpbmcgJiYgIWNvbmZpZy51c2VXaGFtbXlSZWNvcmRlcikge1xyXG4gICAgICAgICAgICAvLyBDYW52YXNDYXB0dXJlTWVkaWFTdHJlYW1cclxuICAgICAgICAgICAgdmFyIGNhbnZhc01lZGlhU3RyZWFtO1xyXG4gICAgICAgICAgICBpZiAoJ2NhcHR1cmVTdHJlYW0nIGluIGdsb2JhbENhbnZhcykge1xyXG4gICAgICAgICAgICAgICAgY2FudmFzTWVkaWFTdHJlYW0gPSBnbG9iYWxDYW52YXMuY2FwdHVyZVN0cmVhbSgyNSk7IC8vIDI1IEZQU1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCdtb3pDYXB0dXJlU3RyZWFtJyBpbiBnbG9iYWxDYW52YXMpIHtcclxuICAgICAgICAgICAgICAgIGNhbnZhc01lZGlhU3RyZWFtID0gZ2xvYmFsQ2FudmFzLm1vekNhcHR1cmVTdHJlYW0oMjUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCd3ZWJraXRDYXB0dXJlU3RyZWFtJyBpbiBnbG9iYWxDYW52YXMpIHtcclxuICAgICAgICAgICAgICAgIGNhbnZhc01lZGlhU3RyZWFtID0gZ2xvYmFsQ2FudmFzLndlYmtpdENhcHR1cmVTdHJlYW0oMjUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1kU3RyZWFtID0gbmV3IE1lZGlhU3RyZWFtKCk7XHJcbiAgICAgICAgICAgICAgICBtZFN0cmVhbS5hZGRUcmFjayhnZXRUcmFja3MoY2FudmFzTWVkaWFTdHJlYW0sICd2aWRlbycpWzBdKTtcclxuICAgICAgICAgICAgICAgIGNhbnZhc01lZGlhU3RyZWFtID0gbWRTdHJlYW07XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNhbnZhc01lZGlhU3RyZWFtKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnY2FwdHVyZVN0cmVhbSBBUEkgYXJlIE5PVCBhdmFpbGFibGUuJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTm90ZTogSmFuIDE4LCAyMDE2IHN0YXR1cyBpcyB0aGF0LCBcclxuICAgICAgICAgICAgLy8gRmlyZWZveCBNZWRpYVJlY29yZGVyIEFQSSBjYW4ndCByZWNvcmQgQ2FudmFzQ2FwdHVyZU1lZGlhU3RyZWFtIG9iamVjdC5cclxuICAgICAgICAgICAgbWVkaWFTdHJlYW1SZWNvcmRlciA9IG5ldyBNZWRpYVN0cmVhbVJlY29yZGVyKGNhbnZhc01lZGlhU3RyZWFtLCB7XHJcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogY29uZmlnLm1pbWVUeXBlIHx8ICd2aWRlby93ZWJtJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbWVkaWFTdHJlYW1SZWNvcmRlci5yZWNvcmQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3aGFtbXkuZnJhbWVzID0gW107XHJcbiAgICAgICAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgIGRyYXdDYW52YXNGcmFtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5pbml0Q2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY29uZmlnLmluaXRDYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRXZWJQSW1hZ2VzID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoaHRtbEVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSAhPT0gJ2NhbnZhcycpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZyYW1lc0xlbmd0aCA9IHdoYW1teS5mcmFtZXMubGVuZ3RoO1xyXG4gICAgICAgIHdoYW1teS5mcmFtZXMuZm9yRWFjaChmdW5jdGlvbihmcmFtZSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBmcmFtZXNSZW1haW5pbmcgPSBmcmFtZXNMZW5ndGggLSBpZHg7XHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhmcmFtZXNSZW1haW5pbmcgKyAnLycgKyBmcmFtZXNMZW5ndGggKyAnIGZyYW1lcyByZW1haW5pbmcnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5vbkVuY29kaW5nQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5vbkVuY29kaW5nQ2FsbGJhY2soZnJhbWVzUmVtYWluaW5nLCBmcmFtZXNMZW5ndGgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd2VicCA9IGZyYW1lLmltYWdlLnRvRGF0YVVSTCgnaW1hZ2Uvd2VicCcsIDEpO1xyXG4gICAgICAgICAgICB3aGFtbXkuZnJhbWVzW2lkeF0uaW1hZ2UgPSB3ZWJwO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnR2VuZXJhdGluZyBXZWJNJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHN0b3BzIHJlY29yZGluZyBDYW52YXMuXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uLCB0aGF0IGlzIHVzZWQgdG8gcGFzcyByZWNvcmRlZCBibG9iIGJhY2sgdG8gdGhlIGNhbGxlZS5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBDYW52YXNSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICBpc1JlY29yZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChpc0NhbnZhc1N1cHBvcnRzU3RyZWFtQ2FwdHVyaW5nICYmIG1lZGlhU3RyZWFtUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgbWVkaWFTdHJlYW1SZWNvcmRlci5zdG9wKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5nZXRXZWJQSW1hZ2VzKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCbG9ifSBibG9iIC0gUmVjb3JkZWQgZnJhbWVzIGluIHZpZGVvL3dlYm0gYmxvYi5cclxuICAgICAgICAgICAgICogQG1lbWJlcm9mIENhbnZhc1JlY29yZGVyXHJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAqICAgICB2YXIgYmxvYiA9IHJlY29yZGVyLmJsb2I7XHJcbiAgICAgICAgICAgICAqIH0pO1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgd2hhbW15LmNvbXBpbGUoZnVuY3Rpb24oYmxvYikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjb3JkaW5nIGZpbmlzaGVkIScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuYmxvYiA9IGJsb2I7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuYmxvYi5mb3JFYWNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5ibG9iID0gbmV3IEJsb2IoW10sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3ZpZGVvL3dlYm0nXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGhhdC5ibG9iKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB3aGFtbXkuZnJhbWVzID0gW107XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgaXNQYXVzZWRSZWNvcmRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgQ2FudmFzUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5wYXVzZSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaXNQYXVzZWRSZWNvcmRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAobWVkaWFTdHJlYW1SZWNvcmRlciBpbnN0YW5jZW9mIE1lZGlhU3RyZWFtUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgbWVkaWFTdHJlYW1SZWNvcmRlci5wYXVzZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlc3VtZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIENhbnZhc1JlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIucmVzdW1lKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaXNQYXVzZWRSZWNvcmRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKG1lZGlhU3RyZWFtUmVjb3JkZXIgaW5zdGFuY2VvZiBNZWRpYVN0cmVhbVJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIG1lZGlhU3RyZWFtUmVjb3JkZXIucmVzdW1lKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNSZWNvcmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzZXRzIGN1cnJlbnRseSByZWNvcmRlZCBkYXRhLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIENhbnZhc1JlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIuY2xlYXJSZWNvcmRlZERhdGEoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5jbGVhclJlY29yZGVkRGF0YSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChpc1JlY29yZGluZykge1xyXG4gICAgICAgICAgICB0aGlzLnN0b3AoY2xlYXJSZWNvcmRlZERhdGFDQik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNsZWFyUmVjb3JkZWREYXRhQ0IoKTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYXJSZWNvcmRlZERhdGFDQigpIHtcclxuICAgICAgICB3aGFtbXkuZnJhbWVzID0gW107XHJcbiAgICAgICAgaXNSZWNvcmRpbmcgPSBmYWxzZTtcclxuICAgICAgICBpc1BhdXNlZFJlY29yZGluZyA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZvciBkZWJ1Z2dpbmdcclxuICAgIHRoaXMubmFtZSA9ICdDYW52YXNSZWNvcmRlcic7XHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gY2xvbmVDYW52YXMoKSB7XHJcbiAgICAgICAgLy9jcmVhdGUgYSBuZXcgY2FudmFzXHJcbiAgICAgICAgdmFyIG5ld0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0gbmV3Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIC8vc2V0IGRpbWVuc2lvbnNcclxuICAgICAgICBuZXdDYW52YXMud2lkdGggPSBodG1sRWxlbWVudC53aWR0aDtcclxuICAgICAgICBuZXdDYW52YXMuaGVpZ2h0ID0gaHRtbEVsZW1lbnQuaGVpZ2h0O1xyXG5cclxuICAgICAgICAvL2FwcGx5IHRoZSBvbGQgY2FudmFzIHRvIHRoZSBuZXcgb25lXHJcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaHRtbEVsZW1lbnQsIDAsIDApO1xyXG5cclxuICAgICAgICAvL3JldHVybiB0aGUgbmV3IGNhbnZhc1xyXG4gICAgICAgIHJldHVybiBuZXdDYW52YXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhd0NhbnZhc0ZyYW1lKCkge1xyXG4gICAgICAgIGlmIChpc1BhdXNlZFJlY29yZGluZykge1xyXG4gICAgICAgICAgICBsYXN0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChkcmF3Q2FudmFzRnJhbWUsIDUwMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaHRtbEVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2NhbnZhcycpIHtcclxuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsYXN0VGltZTtcclxuICAgICAgICAgICAgLy8gdmlhICMyMDYsIGJ5IEphY2sgaS5lLiBAU2V5bW91cnJcclxuICAgICAgICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgICAgIHdoYW1teS5mcmFtZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBpbWFnZTogY2xvbmVDYW52YXMoKSxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc1JlY29yZGluZykge1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChkcmF3Q2FudmFzRnJhbWUsIGNvbmZpZy5mcmFtZUludGVydmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBodG1sMmNhbnZhcyhodG1sRWxlbWVudCwge1xyXG4gICAgICAgICAgICBncmFiTW91c2U6IHR5cGVvZiBjb25maWcuc2hvd01vdXNlUG9pbnRlciA9PT0gJ3VuZGVmaW5lZCcgfHwgY29uZmlnLnNob3dNb3VzZVBvaW50ZXIsXHJcbiAgICAgICAgICAgIG9ucmVuZGVyZWQ6IGZ1bmN0aW9uKGNhbnZhcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsYXN0VGltZTtcclxuICAgICAgICAgICAgICAgIGlmICghZHVyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChkcmF3Q2FudmFzRnJhbWUsIGNvbmZpZy5mcmFtZUludGVydmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyB2aWEgIzIwNiwgYnkgSmFjayBpLmUuIEBTZXltb3VyclxyXG4gICAgICAgICAgICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGFtbXkuZnJhbWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS93ZWJwJywgMSksXHJcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNSZWNvcmRpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGRyYXdDYW52YXNGcmFtZSwgY29uZmlnLmZyYW1lSW50ZXJ2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgdmFyIHdoYW1teSA9IG5ldyBXaGFtbXkuVmlkZW8oMTAwKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBSZWNvcmRSVEMuQ2FudmFzUmVjb3JkZXIgPSBDYW52YXNSZWNvcmRlcjtcclxufVxuXHJcbi8vIF9fX19fX19fX19fX19fX19fXHJcbi8vIFdoYW1teVJlY29yZGVyLmpzXHJcblxyXG4vKipcclxuICogV2hhbW15UmVjb3JkZXIgaXMgYSBzdGFuZGFsb25lIGNsYXNzIHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gYnJpbmcgdmlkZW8gcmVjb3JkaW5nIGluIENocm9tZS4gSXQgcnVucyB0b3Agb3ZlciB7QGxpbmsgV2hhbW15fS5cclxuICogQHN1bW1hcnkgVmlkZW8gcmVjb3JkaW5nIGZlYXR1cmUgaW4gQ2hyb21lLlxyXG4gKiBAbGljZW5zZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEMvYmxvYi9tYXN0ZXIvTElDRU5TRXxNSVR9XHJcbiAqIEBhdXRob3Ige0BsaW5rIGh0dHBzOi8vTXVhektoYW4uY29tfE11YXogS2hhbn1cclxuICogQHR5cGVkZWYgV2hhbW15UmVjb3JkZXJcclxuICogQGNsYXNzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciByZWNvcmRlciA9IG5ldyBXaGFtbXlSZWNvcmRlcihtZWRpYVN0cmVhbSk7XHJcbiAqIHJlY29yZGVyLnJlY29yZCgpO1xyXG4gKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcclxuICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAqIH0pO1xyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQ3xSZWNvcmRSVEMgU291cmNlIENvZGV9XHJcbiAqIEBwYXJhbSB7TWVkaWFTdHJlYW19IG1lZGlhU3RyZWFtIC0gTWVkaWFTdHJlYW0gb2JqZWN0IGZldGNoZWQgdXNpbmcgZ2V0VXNlck1lZGlhIEFQSSBvciBnZW5lcmF0ZWQgdXNpbmcgY2FwdHVyZVN0cmVhbVVudGlsRW5kZWQgb3IgV2ViQXVkaW8gQVBJLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIC0ge2Rpc2FibGVMb2dzOiB0cnVlLCBpbml0Q2FsbGJhY2s6IGZ1bmN0aW9uLCB2aWRlbzogSFRNTFZpZGVvRWxlbWVudCwgZXRjLn1cclxuICovXHJcblxyXG5mdW5jdGlvbiBXaGFtbXlSZWNvcmRlcihtZWRpYVN0cmVhbSwgY29uZmlnKSB7XHJcblxyXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cclxuICAgIGlmICghY29uZmlnLmZyYW1lSW50ZXJ2YWwpIHtcclxuICAgICAgICBjb25maWcuZnJhbWVJbnRlcnZhbCA9IDEwO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1VzaW5nIGZyYW1lcy1pbnRlcnZhbDonLCBjb25maWcuZnJhbWVJbnRlcnZhbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCByZWNvcmRzIHZpZGVvLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFdoYW1teVJlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIucmVjb3JkKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVjb3JkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCFjb25maWcud2lkdGgpIHtcclxuICAgICAgICAgICAgY29uZmlnLndpZHRoID0gMzIwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFjb25maWcuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5oZWlnaHQgPSAyNDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWNvbmZpZy52aWRlbykge1xyXG4gICAgICAgICAgICBjb25maWcudmlkZW8gPSB7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogY29uZmlnLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBjb25maWcuaGVpZ2h0XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWNvbmZpZy5jYW52YXMpIHtcclxuICAgICAgICAgICAgY29uZmlnLmNhbnZhcyA9IHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBjb25maWcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGNvbmZpZy5oZWlnaHRcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGNvbmZpZy5jYW52YXMud2lkdGggfHwgMzIwO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBjb25maWcuY2FudmFzLmhlaWdodCB8fCAyNDA7XHJcblxyXG4gICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgLy8gc2V0dGluZyBkZWZhdWx0c1xyXG4gICAgICAgIGlmIChjb25maWcudmlkZW8gJiYgY29uZmlnLnZpZGVvIGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkge1xyXG4gICAgICAgICAgICB2aWRlbyA9IGNvbmZpZy52aWRlby5jbG9uZU5vZGUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25maWcuaW5pdENhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuaW5pdENhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XHJcblxyXG4gICAgICAgICAgICBzZXRTcmNPYmplY3QobWVkaWFTdHJlYW0sIHZpZGVvKTtcclxuXHJcbiAgICAgICAgICAgIHZpZGVvLm9ubG9hZGVkbWV0YWRhdGEgPSBmdW5jdGlvbigpIHsgLy8gXCJvbmxvYWRlZG1ldGFkYXRhXCIgbWF5IE5PVCB3b3JrIGluIEZGP1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5pbml0Q2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWcuaW5pdENhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2aWRlby53aWR0aCA9IGNvbmZpZy52aWRlby53aWR0aDtcclxuICAgICAgICAgICAgdmlkZW8uaGVpZ2h0ID0gY29uZmlnLnZpZGVvLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZpZGVvLm11dGVkID0gdHJ1ZTtcclxuICAgICAgICB2aWRlby5wbGF5KCk7XHJcblxyXG4gICAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgd2hhbW15ID0gbmV3IFdoYW1teS5WaWRlbygpO1xyXG5cclxuICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY2FudmFzIHJlc29sdXRpb25zJywgY2FudmFzLndpZHRoLCAnKicsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygndmlkZW8gd2lkdGgvaGVpZ2h0JywgdmlkZW8ud2lkdGggfHwgY2FudmFzLndpZHRoLCAnKicsIHZpZGVvLmhlaWdodCB8fCBjYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRyYXdGcmFtZXMoY29uZmlnLmZyYW1lSW50ZXJ2YWwpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERyYXcgYW5kIHB1c2ggZnJhbWVzIHRvIFdoYW1teVxyXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBmcmFtZUludGVydmFsIC0gc2V0IG1pbmltdW0gaW50ZXJ2YWwgKGluIG1pbGxpc2Vjb25kcykgYmV0d2VlbiBlYWNoIHRpbWUgd2UgcHVzaCBhIGZyYW1lIHRvIFdoYW1teVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkcmF3RnJhbWVzKGZyYW1lSW50ZXJ2YWwpIHtcclxuICAgICAgICBmcmFtZUludGVydmFsID0gdHlwZW9mIGZyYW1lSW50ZXJ2YWwgIT09ICd1bmRlZmluZWQnID8gZnJhbWVJbnRlcnZhbCA6IDEwO1xyXG5cclxuICAgICAgICB2YXIgZHVyYXRpb24gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIGxhc3RUaW1lO1xyXG4gICAgICAgIGlmICghZHVyYXRpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZHJhd0ZyYW1lcywgZnJhbWVJbnRlcnZhbCwgZnJhbWVJbnRlcnZhbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNQYXVzZWRSZWNvcmRpbmcpIHtcclxuICAgICAgICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZHJhd0ZyYW1lcywgMTAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHZpYSAjMjA2LCBieSBKYWNrIGkuZS4gQFNleW1vdXJyXHJcbiAgICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgaWYgKHZpZGVvLnBhdXNlZCkge1xyXG4gICAgICAgICAgICAvLyB2aWE6IGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vV2ViUlRDLUV4cGVyaW1lbnQvcHVsbC8zMTZcclxuICAgICAgICAgICAgLy8gVHdlYWsgZm9yIEFuZHJvaWQgQ2hyb21lXHJcbiAgICAgICAgICAgIHZpZGVvLnBsYXkoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgIHdoYW1teS5mcmFtZXMucHVzaCh7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvbixcclxuICAgICAgICAgICAgaW1hZ2U6IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3dlYnAnKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWlzU3RvcERyYXdpbmcpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChkcmF3RnJhbWVzLCBmcmFtZUludGVydmFsLCBmcmFtZUludGVydmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXN5bmNMb29wKG8pIHtcclxuICAgICAgICB2YXIgaSA9IC0xLFxyXG4gICAgICAgICAgICBsZW5ndGggPSBvLmxlbmd0aDtcclxuXHJcbiAgICAgICAgKGZ1bmN0aW9uIGxvb3AoKSB7XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgaWYgKGkgPT09IGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgby5jYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBcInNldFRpbWVvdXRcIiBhZGRlZCBieSBKaW0gTWNMZW9kXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBvLmZ1bmN0aW9uVG9Mb29wKGxvb3AsIGkpO1xyXG4gICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZSBibGFjayBmcmFtZXMgZnJvbSB0aGUgYmVnaW5uaW5nIHRvIHRoZSBzcGVjaWZpZWQgZnJhbWVcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IF9mcmFtZXMgLSBhcnJheSBvZiBmcmFtZXMgdG8gYmUgY2hlY2tlZFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IF9mcmFtZXNUb0NoZWNrIC0gbnVtYmVyIG9mIGZyYW1lIHVudGlsIGNoZWNrIHdpbGwgYmUgZXhlY3V0ZWQgKC0xIC0gd2lsbCBkcm9wIGFsbCBmcmFtZXMgdW50aWwgZnJhbWUgbm90IG1hdGNoZWQgd2lsbCBiZSBmb3VuZClcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBfcGl4VG9sZXJhbmNlIC0gMCAtIHZlcnkgc3RyaWN0IChvbmx5IGJsYWNrIHBpeGVsIGNvbG9yKSA7IDEgLSBhbGxcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBfZnJhbWVUb2xlcmFuY2UgLSAwIC0gdmVyeSBzdHJpY3QgKG9ubHkgYmxhY2sgZnJhbWUgY29sb3IpIDsgMSAtIGFsbFxyXG4gICAgICogQHJldHVybnMge0FycmF5fSAtIGFycmF5IG9mIGZyYW1lc1xyXG4gICAgICovXHJcbiAgICAvLyBwdWxsIzI5MyBieSBAdm9sb2RhbGV4ZXlcclxuICAgIGZ1bmN0aW9uIGRyb3BCbGFja0ZyYW1lcyhfZnJhbWVzLCBfZnJhbWVzVG9DaGVjaywgX3BpeFRvbGVyYW5jZSwgX2ZyYW1lVG9sZXJhbmNlLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBsb2NhbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIGxvY2FsQ2FudmFzLndpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIGxvY2FsQ2FudmFzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcbiAgICAgICAgdmFyIGNvbnRleHQyZCA9IGxvY2FsQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgdmFyIHJlc3VsdEZyYW1lcyA9IFtdO1xyXG5cclxuICAgICAgICB2YXIgY2hlY2tVbnRpbE5vdEJsYWNrID0gX2ZyYW1lc1RvQ2hlY2sgPT09IC0xO1xyXG4gICAgICAgIHZhciBlbmRDaGVja0ZyYW1lID0gKF9mcmFtZXNUb0NoZWNrICYmIF9mcmFtZXNUb0NoZWNrID4gMCAmJiBfZnJhbWVzVG9DaGVjayA8PSBfZnJhbWVzLmxlbmd0aCkgP1xyXG4gICAgICAgICAgICBfZnJhbWVzVG9DaGVjayA6IF9mcmFtZXMubGVuZ3RoO1xyXG4gICAgICAgIHZhciBzYW1wbGVDb2xvciA9IHtcclxuICAgICAgICAgICAgcjogMCxcclxuICAgICAgICAgICAgZzogMCxcclxuICAgICAgICAgICAgYjogMFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIG1heENvbG9yRGlmZmVyZW5jZSA9IE1hdGguc3FydChcclxuICAgICAgICAgICAgTWF0aC5wb3coMjU1LCAyKSArXHJcbiAgICAgICAgICAgIE1hdGgucG93KDI1NSwgMikgK1xyXG4gICAgICAgICAgICBNYXRoLnBvdygyNTUsIDIpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB2YXIgcGl4VG9sZXJhbmNlID0gX3BpeFRvbGVyYW5jZSAmJiBfcGl4VG9sZXJhbmNlID49IDAgJiYgX3BpeFRvbGVyYW5jZSA8PSAxID8gX3BpeFRvbGVyYW5jZSA6IDA7XHJcbiAgICAgICAgdmFyIGZyYW1lVG9sZXJhbmNlID0gX2ZyYW1lVG9sZXJhbmNlICYmIF9mcmFtZVRvbGVyYW5jZSA+PSAwICYmIF9mcmFtZVRvbGVyYW5jZSA8PSAxID8gX2ZyYW1lVG9sZXJhbmNlIDogMDtcclxuICAgICAgICB2YXIgZG9Ob3RDaGVja05leHQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgYXN5bmNMb29wKHtcclxuICAgICAgICAgICAgbGVuZ3RoOiBlbmRDaGVja0ZyYW1lLFxyXG4gICAgICAgICAgICBmdW5jdGlvblRvTG9vcDogZnVuY3Rpb24obG9vcCwgZikge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoUGl4Q291bnQsIGVuZFBpeENoZWNrLCBtYXhQaXhDb3VudDtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZmluaXNoSW1hZ2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRvTm90Q2hlY2tOZXh0ICYmIG1heFBpeENvdW50IC0gbWF0Y2hQaXhDb3VudCA8PSBtYXhQaXhDb3VudCAqIGZyYW1lVG9sZXJhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdyZW1vdmVkIGJsYWNrIGZyYW1lIDogJyArIGYgKyAnIDsgZnJhbWUgZHVyYXRpb24gJyArIF9mcmFtZXNbZl0uZHVyYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdmcmFtZSBpcyBwYXNzZWQgOiAnICsgZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGVja1VudGlsTm90QmxhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvTm90Q2hlY2tOZXh0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRGcmFtZXMucHVzaChfZnJhbWVzW2ZdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbG9vcCgpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWRvTm90Q2hlY2tOZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQyZC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWFnZURhdGEgPSBjb250ZXh0MmQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoUGl4Q291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRQaXhDaGVjayA9IGltYWdlRGF0YS5kYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4UGl4Q291bnQgPSBpbWFnZURhdGEuZGF0YS5sZW5ndGggLyA0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcGl4ID0gMDsgcGl4IDwgZW5kUGl4Q2hlY2s7IHBpeCArPSA0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudENvbG9yID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHI6IGltYWdlRGF0YS5kYXRhW3BpeF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZzogaW1hZ2VEYXRhLmRhdGFbcGl4ICsgMV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYjogaW1hZ2VEYXRhLmRhdGFbcGl4ICsgMl1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JEaWZmZXJlbmNlID0gTWF0aC5zcXJ0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGN1cnJlbnRDb2xvci5yIC0gc2FtcGxlQ29sb3IuciwgMikgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGN1cnJlbnRDb2xvci5nIC0gc2FtcGxlQ29sb3IuZywgMikgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGN1cnJlbnRDb2xvci5iIC0gc2FtcGxlQ29sb3IuYiwgMilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaWZmZXJlbmNlIGluIGNvbG9yIGl0IGlzIGRpZmZlcmVuY2UgaW4gY29sb3IgdmVjdG9ycyAocjEsZzEsYjEpIDw9PiAocjIsZzIsYjIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sb3JEaWZmZXJlbmNlIDw9IG1heENvbG9yRGlmZmVyZW5jZSAqIHBpeFRvbGVyYW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoUGl4Q291bnQrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5pc2hJbWFnZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2Uuc3JjID0gX2ZyYW1lc1tmXS5pbWFnZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmluaXNoSW1hZ2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0RnJhbWVzID0gcmVzdWx0RnJhbWVzLmNvbmNhdChfZnJhbWVzLnNsaWNlKGVuZENoZWNrRnJhbWUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0RnJhbWVzLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYXQgbGVhc3Qgb25lIGxhc3QgZnJhbWUgc2hvdWxkIGJlIGF2YWlsYWJsZSBmb3IgbmV4dCBtYW5pcHVsYXRpb25cclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0b3RhbCBkdXJhdGlvbiBvZiBhbGwgZnJhbWVzIHdpbGwgYmUgPCAxMDAwIHRoYW4gZmZtcGVnIGRvZXNuJ3Qgd29yayB3ZWxsLi4uXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0RnJhbWVzLnB1c2goX2ZyYW1lc1tfZnJhbWVzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3VsdEZyYW1lcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaXNTdG9wRHJhd2luZyA9IGZhbHNlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgcmVjb3JkaW5nIHZpZGVvLlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgV2hhbW15UmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcclxuICAgICAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICogfSk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xyXG5cclxuICAgICAgICBpc1N0b3BEcmF3aW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAvLyBhbmFseXNlIG9mIGFsbCBmcmFtZXMgdGFrZXMgc29tZSB0aW1lIVxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIGUuZy4gZHJvcEJsYWNrRnJhbWVzKGZyYW1lcywgMTAsIDEsIDEpIC0gd2lsbCBjdXQgYWxsIDEwIGZyYW1lc1xyXG4gICAgICAgICAgICAvLyBlLmcuIGRyb3BCbGFja0ZyYW1lcyhmcmFtZXMsIDEwLCAwLjUsIDAuNSkgLSB3aWxsIGFuYWx5c2UgMTAgZnJhbWVzXHJcbiAgICAgICAgICAgIC8vIGUuZy4gZHJvcEJsYWNrRnJhbWVzKGZyYW1lcywgMTApID09PSBkcm9wQmxhY2tGcmFtZXMoZnJhbWVzLCAxMCwgMCwgMCkgLSB3aWxsIGFuYWx5c2UgMTAgZnJhbWVzIHdpdGggc3RyaWN0IGJsYWNrIGNvbG9yXHJcbiAgICAgICAgICAgIGRyb3BCbGFja0ZyYW1lcyh3aGFtbXkuZnJhbWVzLCAtMSwgbnVsbCwgbnVsbCwgZnVuY3Rpb24oZnJhbWVzKSB7XHJcbiAgICAgICAgICAgICAgICB3aGFtbXkuZnJhbWVzID0gZnJhbWVzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHRvIGRpc3BsYXkgYWR2ZXJ0aXNlbWVudCBpbWFnZXMhXHJcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmFkdmVydGlzZW1lbnQgJiYgY29uZmlnLmFkdmVydGlzZW1lbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hhbW15LmZyYW1lcyA9IGNvbmZpZy5hZHZlcnRpc2VtZW50LmNvbmNhdCh3aGFtbXkuZnJhbWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7QmxvYn0gYmxvYiAtIFJlY29yZGVkIGZyYW1lcyBpbiB2aWRlby93ZWJtIGJsb2IuXHJcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyb2YgV2hhbW15UmVjb3JkZXJcclxuICAgICAgICAgICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICAgICAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcclxuICAgICAgICAgICAgICAgICAqIH0pO1xyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB3aGFtbXkuY29tcGlsZShmdW5jdGlvbihibG9iKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYmxvYiA9IGJsb2I7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5ibG9iLmZvckVhY2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuYmxvYiA9IG5ldyBCbG9iKFtdLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndmlkZW8vd2VibSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soX3RoaXMuYmxvYik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIDEwKTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGlzUGF1c2VkUmVjb3JkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFdoYW1teVJlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIucGF1c2UoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlzUGF1c2VkUmVjb3JkaW5nID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCByZXN1bWVzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBXaGFtbXlSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnJlc3VtZSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlzUGF1c2VkUmVjb3JkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChpc1N0b3BEcmF3aW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVjb3JkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlc2V0cyBjdXJyZW50bHkgcmVjb3JkZWQgZGF0YS5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBXaGFtbXlSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLmNsZWFyUmVjb3JkZWREYXRhKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuY2xlYXJSZWNvcmRlZERhdGEgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoIWlzU3RvcERyYXdpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5zdG9wKGNsZWFyUmVjb3JkZWREYXRhQ0IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjbGVhclJlY29yZGVkRGF0YUNCKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGNsZWFyUmVjb3JkZWREYXRhQ0IoKSB7XHJcbiAgICAgICAgd2hhbW15LmZyYW1lcyA9IFtdO1xyXG4gICAgICAgIGlzU3RvcERyYXdpbmcgPSB0cnVlO1xyXG4gICAgICAgIGlzUGF1c2VkUmVjb3JkaW5nID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZm9yIGRlYnVnZ2luZ1xyXG4gICAgdGhpcy5uYW1lID0gJ1doYW1teVJlY29yZGVyJztcclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIHZhciB2aWRlbztcclxuICAgIHZhciBsYXN0VGltZTtcclxuICAgIHZhciB3aGFtbXk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgUmVjb3JkUlRDICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgUmVjb3JkUlRDLldoYW1teVJlY29yZGVyID0gV2hhbW15UmVjb3JkZXI7XHJcbn1cblxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vYW50aW1hdHRlcjE1L3doYW1teS9ibG9iL21hc3Rlci9MSUNFTlNFXHJcbi8vIF9fX19fX19fX1xyXG4vLyBXaGFtbXkuanNcclxuXHJcbi8vIHRvZG86IEZpcmVmb3ggbm93IHN1cHBvcnRzIHdlYnAgZm9yIHdlYm0gY29udGFpbmVycyFcclxuLy8gdGhlaXIgTWVkaWFSZWNvcmRlciBpbXBsZW1lbnRhdGlvbiB3b3JrcyB3ZWxsIVxyXG4vLyBzaG91bGQgd2UgcHJvdmlkZSBhbiBvcHRpb24gdG8gcmVjb3JkIHZpYSBXaGFtbXkuanMgb3IgTWVkaWFSZWNvcmRlciBBUEkgaXMgYSBiZXR0ZXIgc29sdXRpb24/XHJcblxyXG4vKipcclxuICogV2hhbW15IGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIHZpZGVvIHJlY29yZGluZyBpbiBDaHJvbWUuIEl0IGlzIHdyaXR0ZW4gYnkge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9hbnRpbWF0dGVyMTV8YW50aW1hdHRlcjE1fVxyXG4gKiBAc3VtbWFyeSBBIHJlYWwgdGltZSBqYXZhc2NyaXB0IHdlYm0gZW5jb2RlciBiYXNlZCBvbiBhIGNhbnZhcyBoYWNrLlxyXG4gKiBAbGljZW5zZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEMvYmxvYi9tYXN0ZXIvTElDRU5TRXxNSVR9XHJcbiAqIEBhdXRob3Ige0BsaW5rIGh0dHBzOi8vTXVhektoYW4uY29tfE11YXogS2hhbn1cclxuICogQHR5cGVkZWYgV2hhbW15XHJcbiAqIEBjbGFzc1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgV2hhbW15KCkuVmlkZW8oMTUpO1xyXG4gKiByZWNvcmRlci5hZGQoY29udGV4dCB8fCBjYW52YXMgfHwgZGF0YVVSTCk7XHJcbiAqIHZhciBvdXRwdXQgPSByZWNvcmRlci5jb21waWxlKCk7XHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICovXHJcblxyXG52YXIgV2hhbW15ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gYSBtb3JlIGFic3RyYWN0LWlzaCBBUElcclxuXHJcbiAgICBmdW5jdGlvbiBXaGFtbXlWaWRlbyhkdXJhdGlvbikge1xyXG4gICAgICAgIHRoaXMuZnJhbWVzID0gW107XHJcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uIHx8IDE7XHJcbiAgICAgICAgdGhpcy5xdWFsaXR5ID0gMC44O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFzcyBDYW52YXMgb3IgQ29udGV4dCBvciBpbWFnZS93ZWJwKHN0cmluZykgdG8ge0BsaW5rIFdoYW1teX0gZW5jb2Rlci5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBXaGFtbXlcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlciA9IG5ldyBXaGFtbXkoKS5WaWRlbygwLjgsIDEwMCk7XHJcbiAgICAgKiByZWNvcmRlci5hZGQoY2FudmFzIHx8IGNvbnRleHQgfHwgJ2ltYWdlL3dlYnAnKTtcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmcmFtZSAtIENhbnZhcyB8fCBDb250ZXh0IHx8IGltYWdlL3dlYnBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIFN0aWNrIGEgZHVyYXRpb24gKGluIG1pbGxpc2Vjb25kcylcclxuICAgICAqL1xyXG4gICAgV2hhbW15VmlkZW8ucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGZyYW1lLCBkdXJhdGlvbikge1xyXG4gICAgICAgIGlmICgnY2FudmFzJyBpbiBmcmFtZSkgeyAvL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxyXG4gICAgICAgICAgICBmcmFtZSA9IGZyYW1lLmNhbnZhcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgndG9EYXRhVVJMJyBpbiBmcmFtZSkge1xyXG4gICAgICAgICAgICBmcmFtZSA9IGZyYW1lLnRvRGF0YVVSTCgnaW1hZ2Uvd2VicCcsIHRoaXMucXVhbGl0eSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISgvXmRhdGE6aW1hZ2VcXC93ZWJwO2Jhc2U2NCwvaWcpLnRlc3QoZnJhbWUpKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdJbnB1dCBtdXN0IGJlIGZvcm1hdHRlZCBwcm9wZXJseSBhcyBhIGJhc2U2NCBlbmNvZGVkIERhdGFVUkkgb2YgdHlwZSBpbWFnZS93ZWJwJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5mcmFtZXMucHVzaCh7XHJcbiAgICAgICAgICAgIGltYWdlOiBmcmFtZSxcclxuICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uIHx8IHRoaXMuZHVyYXRpb25cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0luV2ViV29ya2VyKF9mdW5jdGlvbikge1xyXG4gICAgICAgIHZhciBibG9iID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbX2Z1bmN0aW9uLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICd0aGlzLm9ubWVzc2FnZSA9ICBmdW5jdGlvbiAoZWVlKSB7JyArIF9mdW5jdGlvbi5uYW1lICsgJyhlZWUuZGF0YSk7fSdcclxuICAgICAgICBdLCB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0J1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoYmxvYik7XHJcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICByZXR1cm4gd29ya2VyO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHdoYW1teUluV2ViV29ya2VyKGZyYW1lcykge1xyXG4gICAgICAgIGZ1bmN0aW9uIEFycmF5VG9XZWJNKGZyYW1lcykge1xyXG4gICAgICAgICAgICB2YXIgaW5mbyA9IGNoZWNrRnJhbWVzKGZyYW1lcyk7XHJcbiAgICAgICAgICAgIGlmICghaW5mbykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY2x1c3Rlck1heER1cmF0aW9uID0gMzAwMDA7XHJcblxyXG4gICAgICAgICAgICB2YXIgRUJNTCA9IFt7XHJcbiAgICAgICAgICAgICAgICAnaWQnOiAweDFhNDVkZmEzLCAvLyBFQk1MXHJcbiAgICAgICAgICAgICAgICAnZGF0YSc6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NDI4NiAvLyBFQk1MVmVyc2lvblxyXG4gICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICdkYXRhJzogMSxcclxuICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDQyZjcgLy8gRUJNTFJlYWRWZXJzaW9uXHJcbiAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiA0LFxyXG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NDJmMiAvLyBFQk1MTWF4SURMZW5ndGhcclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDgsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0MmYzIC8vIEVCTUxNYXhTaXplTGVuZ3RoXHJcbiAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnd2VibScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0MjgyIC8vIERvY1R5cGVcclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0Mjg3IC8vIERvY1R5cGVWZXJzaW9uXHJcbiAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAyLFxyXG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NDI4NSAvLyBEb2NUeXBlUmVhZFZlcnNpb25cclxuICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICdpZCc6IDB4MTg1MzgwNjcsIC8vIFNlZ21lbnRcclxuICAgICAgICAgICAgICAgICdkYXRhJzogW3tcclxuICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDE1NDlhOTY2LCAvLyBJbmZvXHJcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDFlNiwgLy9kbyB0aGluZ3MgaW4gbWlsbGlzZWNzIChudW0gb2YgbmFub3NlY3MgZm9yIGR1cmF0aW9uIHNjYWxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDJhZDdiMSAvLyBUaW1lY29kZVNjYWxlXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6ICd3aGFtbXknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDRkODAgLy8gTXV4aW5nQXBwXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6ICd3aGFtbXknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDU3NDEgLy8gV3JpdGluZ0FwcFxyXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBkb3VibGVUb1N0cmluZyhpbmZvLmR1cmF0aW9uKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0NDg5IC8vIER1cmF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDE2NTRhZTZiLCAvLyBUcmFja3NcclxuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4YWUsIC8vIFRyYWNrRW50cnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHhkNyAvLyBUcmFja051bWJlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDczYzUgLy8gVHJhY2tVSURcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg5YyAvLyBGbGFnTGFjaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogJ3VuZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDIyYjU5YyAvLyBMYW5ndWFnZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6ICdWX1ZQOCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDg2IC8vIENvZGVjSURcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnVlA4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4MjU4Njg4IC8vIENvZGVjTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDgzIC8vIFRyYWNrVHlwZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweGUwLCAvLyBWaWRlb1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogaW5mby53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweGIwIC8vIFBpeGVsV2lkdGhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IGluZm8uaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4YmEgLy8gUGl4ZWxIZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgIH1dO1xyXG5cclxuICAgICAgICAgICAgLy9HZW5lcmF0ZSBjbHVzdGVycyAobWF4IGR1cmF0aW9uKVxyXG4gICAgICAgICAgICB2YXIgZnJhbWVOdW1iZXIgPSAwO1xyXG4gICAgICAgICAgICB2YXIgY2x1c3RlclRpbWVjb2RlID0gMDtcclxuICAgICAgICAgICAgd2hpbGUgKGZyYW1lTnVtYmVyIDwgZnJhbWVzLmxlbmd0aCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjbHVzdGVyRnJhbWVzID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgY2x1c3RlckR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHVzdGVyRnJhbWVzLnB1c2goZnJhbWVzW2ZyYW1lTnVtYmVyXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2x1c3RlckR1cmF0aW9uICs9IGZyYW1lc1tmcmFtZU51bWJlcl0uZHVyYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVOdW1iZXIrKztcclxuICAgICAgICAgICAgICAgIH0gd2hpbGUgKGZyYW1lTnVtYmVyIDwgZnJhbWVzLmxlbmd0aCAmJiBjbHVzdGVyRHVyYXRpb24gPCBjbHVzdGVyTWF4RHVyYXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjbHVzdGVyQ291bnRlciA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2x1c3RlciA9IHtcclxuICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDFmNDNiNjc1LCAvLyBDbHVzdGVyXHJcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBnZXRDbHVzdGVyRGF0YShjbHVzdGVyVGltZWNvZGUsIGNsdXN0ZXJDb3VudGVyLCBjbHVzdGVyRnJhbWVzKVxyXG4gICAgICAgICAgICAgICAgfTsgLy9BZGQgY2x1c3RlciB0byBzZWdtZW50XHJcbiAgICAgICAgICAgICAgICBFQk1MWzFdLmRhdGEucHVzaChjbHVzdGVyKTtcclxuICAgICAgICAgICAgICAgIGNsdXN0ZXJUaW1lY29kZSArPSBjbHVzdGVyRHVyYXRpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUVCTUwoRUJNTCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRDbHVzdGVyRGF0YShjbHVzdGVyVGltZWNvZGUsIGNsdXN0ZXJDb3VudGVyLCBjbHVzdGVyRnJhbWVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbe1xyXG4gICAgICAgICAgICAgICAgJ2RhdGEnOiBjbHVzdGVyVGltZWNvZGUsXHJcbiAgICAgICAgICAgICAgICAnaWQnOiAweGU3IC8vIFRpbWVjb2RlXHJcbiAgICAgICAgICAgIH1dLmNvbmNhdChjbHVzdGVyRnJhbWVzLm1hcChmdW5jdGlvbih3ZWJwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmxvY2sgPSBtYWtlU2ltcGxlQmxvY2soe1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc2NhcmRhYmxlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lOiB3ZWJwLmRhdGEuc2xpY2UoNCksXHJcbiAgICAgICAgICAgICAgICAgICAgaW52aXNpYmxlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleWZyYW1lOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhY2luZzogMCxcclxuICAgICAgICAgICAgICAgICAgICB0cmFja051bTogMSxcclxuICAgICAgICAgICAgICAgICAgICB0aW1lY29kZTogTWF0aC5yb3VuZChjbHVzdGVyQ291bnRlcilcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY2x1c3RlckNvdW50ZXIgKz0gd2VicC5kdXJhdGlvbjtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogYmxvY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IDB4YTNcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHN1bXMgdGhlIGxlbmd0aHMgb2YgYWxsIHRoZSBmcmFtZXMgYW5kIGdldHMgdGhlIGR1cmF0aW9uXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrRnJhbWVzKGZyYW1lcykge1xyXG4gICAgICAgICAgICBpZiAoIWZyYW1lc1swXSkge1xyXG4gICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAnU29tZXRoaW5nIHdlbnQgd3JvbmcuIE1heWJlIFdlYlAgZm9ybWF0IGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIGN1cnJlbnQgYnJvd3Nlci4nXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gZnJhbWVzWzBdLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gZnJhbWVzWzBdLmhlaWdodCxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gZnJhbWVzWzBdLmR1cmF0aW9uO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IGZyYW1lc1tpXS5kdXJhdGlvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG51bVRvQnVmZmVyKG51bSkge1xyXG4gICAgICAgICAgICB2YXIgcGFydHMgPSBbXTtcclxuICAgICAgICAgICAgd2hpbGUgKG51bSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHBhcnRzLnB1c2gobnVtICYgMHhmZik7XHJcbiAgICAgICAgICAgICAgICBudW0gPSBudW0gPj4gODtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkocGFydHMucmV2ZXJzZSgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHN0clRvQnVmZmVyKHN0cikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoc3RyLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGUuY2hhckNvZGVBdCgwKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYml0c1RvQnVmZmVyKGJpdHMpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBbXTtcclxuICAgICAgICAgICAgdmFyIHBhZCA9IChiaXRzLmxlbmd0aCAlIDgpID8gKG5ldyBBcnJheSgxICsgOCAtIChiaXRzLmxlbmd0aCAlIDgpKSkuam9pbignMCcpIDogJyc7XHJcbiAgICAgICAgICAgIGJpdHMgPSBwYWQgKyBiaXRzO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJpdHMubGVuZ3RoOyBpICs9IDgpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEucHVzaChwYXJzZUludChiaXRzLnN1YnN0cihpLCA4KSwgMikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShkYXRhKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdlbmVyYXRlRUJNTChqc29uKSB7XHJcbiAgICAgICAgICAgIHZhciBlYm1sID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBqc29uW2ldLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBnZW5lcmF0ZUVCTUwoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBiaXRzVG9CdWZmZXIoZGF0YS50b1N0cmluZygyKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBzdHJUb0J1ZmZlcihkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gZGF0YS5zaXplIHx8IGRhdGEuYnl0ZUxlbmd0aCB8fCBkYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHZhciB6ZXJvZXMgPSBNYXRoLmNlaWwoTWF0aC5jZWlsKE1hdGgubG9nKGxlbikgLyBNYXRoLmxvZygyKSkgLyA4KTtcclxuICAgICAgICAgICAgICAgIHZhciBzaXplVG9TdHJpbmcgPSBsZW4udG9TdHJpbmcoMik7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFkZGVkID0gKG5ldyBBcnJheSgoemVyb2VzICogNyArIDcgKyAxKSAtIHNpemVUb1N0cmluZy5sZW5ndGgpKS5qb2luKCcwJykgKyBzaXplVG9TdHJpbmc7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IChuZXcgQXJyYXkoemVyb2VzKSkuam9pbignMCcpICsgJzEnICsgcGFkZGVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGVibWwucHVzaChudW1Ub0J1ZmZlcihqc29uW2ldLmlkKSk7XHJcbiAgICAgICAgICAgICAgICBlYm1sLnB1c2goYml0c1RvQnVmZmVyKHNpemUpKTtcclxuICAgICAgICAgICAgICAgIGVibWwucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCbG9iKGVibWwsIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICd2aWRlby93ZWJtJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHRvQmluU3RyT2xkKGJpdHMpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSAnJztcclxuICAgICAgICAgICAgdmFyIHBhZCA9IChiaXRzLmxlbmd0aCAlIDgpID8gKG5ldyBBcnJheSgxICsgOCAtIChiaXRzLmxlbmd0aCAlIDgpKSkuam9pbignMCcpIDogJyc7XHJcbiAgICAgICAgICAgIGJpdHMgPSBwYWQgKyBiaXRzO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJpdHMubGVuZ3RoOyBpICs9IDgpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChiaXRzLnN1YnN0cihpLCA4KSwgMikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbWFrZVNpbXBsZUJsb2NrKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGZsYWdzID0gMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLmtleWZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBmbGFncyB8PSAxMjg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLmludmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgZmxhZ3MgfD0gODtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEubGFjaW5nKSB7XHJcbiAgICAgICAgICAgICAgICBmbGFncyB8PSAoZGF0YS5sYWNpbmcgPDwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLmRpc2NhcmRhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICBmbGFncyB8PSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF0YS50cmFja051bSA+IDEyNykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RyYWNrTnVtYmVyID4gMTI3IG5vdCBzdXBwb3J0ZWQnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgb3V0ID0gW2RhdGEudHJhY2tOdW0gfCAweDgwLCBkYXRhLnRpbWVjb2RlID4+IDgsIGRhdGEudGltZWNvZGUgJiAweGZmLCBmbGFnc10ubWFwKGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGUpO1xyXG4gICAgICAgICAgICB9KS5qb2luKCcnKSArIGRhdGEuZnJhbWU7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcGFyc2VXZWJQKHJpZmYpIHtcclxuICAgICAgICAgICAgdmFyIFZQOCA9IHJpZmYuUklGRlswXS5XRUJQWzBdO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZyYW1lU3RhcnQgPSBWUDguaW5kZXhPZignXFx4OWRcXHgwMVxceDJhJyk7IC8vIEEgVlA4IGtleWZyYW1lIHN0YXJ0cyB3aXRoIHRoZSAweDlkMDEyYSBoZWFkZXJcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGMgPSBbXTsgaSA8IDQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY1tpXSA9IFZQOC5jaGFyQ29kZUF0KGZyYW1lU3RhcnQgKyAzICsgaSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB3aWR0aCwgaGVpZ2h0LCB0bXA7XHJcblxyXG4gICAgICAgICAgICAvL3RoZSBjb2RlIGJlbG93IGlzIGxpdGVyYWxseSBjb3BpZWQgdmVyYmF0aW0gZnJvbSB0aGUgYml0c3RyZWFtIHNwZWNcclxuICAgICAgICAgICAgdG1wID0gKGNbMV0gPDwgOCkgfCBjWzBdO1xyXG4gICAgICAgICAgICB3aWR0aCA9IHRtcCAmIDB4M0ZGRjtcclxuICAgICAgICAgICAgdG1wID0gKGNbM10gPDwgOCkgfCBjWzJdO1xyXG4gICAgICAgICAgICBoZWlnaHQgPSB0bXAgJiAweDNGRkY7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IFZQOCxcclxuICAgICAgICAgICAgICAgIHJpZmY6IHJpZmZcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFN0ckxlbmd0aChzdHJpbmcsIG9mZnNldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihvZmZzZXQgKyA0LCA0KS5zcGxpdCgnJykubWFwKGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICAgICAgICAgIHZhciB1bnBhZGRlZCA9IGkuY2hhckNvZGVBdCgwKS50b1N0cmluZygyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAobmV3IEFycmF5KDggLSB1bnBhZGRlZC5sZW5ndGggKyAxKSkuam9pbignMCcpICsgdW5wYWRkZWQ7XHJcbiAgICAgICAgICAgIH0pLmpvaW4oJycpLCAyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlUklGRihzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgIHZhciBjaHVua3MgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChvZmZzZXQgPCBzdHJpbmcubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBzdHJpbmcuc3Vic3RyKG9mZnNldCwgNCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gZ2V0U3RyTGVuZ3RoKHN0cmluZywgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gc3RyaW5nLnN1YnN0cihvZmZzZXQgKyA0ICsgNCwgbGVuKTtcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSA0ICsgNCArIGxlbjtcclxuICAgICAgICAgICAgICAgIGNodW5rc1tpZF0gPSBjaHVua3NbaWRdIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gJ1JJRkYnIHx8IGlkID09PSAnTElTVCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBjaHVua3NbaWRdLnB1c2gocGFyc2VSSUZGKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2h1bmtzW2lkXS5wdXNoKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBjaHVua3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBkb3VibGVUb1N0cmluZyhudW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoXHJcbiAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheSgobmV3IEZsb2F0NjRBcnJheShbbnVtXSkpLmJ1ZmZlciksIDApLm1hcChmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShlKTtcclxuICAgICAgICAgICAgfSkucmV2ZXJzZSgpLmpvaW4oJycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHdlYm0gPSBuZXcgQXJyYXlUb1dlYk0oZnJhbWVzLm1hcChmdW5jdGlvbihmcmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgd2VicCA9IHBhcnNlV2ViUChwYXJzZVJJRkYoYXRvYihmcmFtZS5pbWFnZS5zbGljZSgyMykpKSk7XHJcbiAgICAgICAgICAgIHdlYnAuZHVyYXRpb24gPSBmcmFtZS5kdXJhdGlvbjtcclxuICAgICAgICAgICAgcmV0dXJuIHdlYnA7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBwb3N0TWVzc2FnZSh3ZWJtKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuY29kZXMgZnJhbWVzIGluIFdlYk0gY29udGFpbmVyLiBJdCB1c2VzIFdlYldvcmtpbnZva2UgdG8gaW52b2tlICdBcnJheVRvV2ViTScgbWV0aG9kLlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgV2hhbW15XHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIgPSBuZXcgV2hhbW15KCkuVmlkZW8oMC44LCAxMDApO1xyXG4gICAgICogcmVjb3JkZXIuY29tcGlsZShmdW5jdGlvbihibG9iKSB7XHJcbiAgICAgKiAgICAvLyBibG9iLnNpemUgLSBibG9iLnR5cGVcclxuICAgICAqIH0pO1xyXG4gICAgICovXHJcbiAgICBXaGFtbXlWaWRlby5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIHdlYldvcmtlciA9IHByb2Nlc3NJbldlYldvcmtlcih3aGFtbXlJbldlYldvcmtlcik7XHJcblxyXG4gICAgICAgIHdlYldvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YS5lcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYWxsYmFjayhldmVudC5kYXRhKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB3ZWJXb3JrZXIucG9zdE1lc3NhZ2UodGhpcy5mcmFtZXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgbW9yZSBhYnN0cmFjdC1pc2ggQVBJLlxyXG4gICAgICAgICAqIEBtZXRob2RcclxuICAgICAgICAgKiBAbWVtYmVyb2YgV2hhbW15XHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiByZWNvcmRlciA9IG5ldyBXaGFtbXkoKS5WaWRlbygwLjgsIDEwMCk7XHJcbiAgICAgICAgICogQHBhcmFtIHs/bnVtYmVyfSBzcGVlZCAtIDAuOFxyXG4gICAgICAgICAqIEBwYXJhbSB7P251bWJlcn0gcXVhbGl0eSAtIDEwMFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFZpZGVvOiBXaGFtbXlWaWRlb1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmlmICh0eXBlb2YgUmVjb3JkUlRDICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgUmVjb3JkUlRDLldoYW1teSA9IFdoYW1teTtcclxufVxuXHJcbi8vIF9fX19fX19fX19fX19fIChpbmRleGVkLWRiKVxyXG4vLyBEaXNrU3RvcmFnZS5qc1xyXG5cclxuLyoqXHJcbiAqIERpc2tTdG9yYWdlIGlzIGEgc3RhbmRhbG9uZSBvYmplY3QgdXNlZCBieSB7QGxpbmsgUmVjb3JkUlRDfSB0byBzdG9yZSByZWNvcmRlZCBibG9icyBpbiBJbmRleGVkREIgc3RvcmFnZS5cclxuICogQHN1bW1hcnkgV3JpdGluZyBibG9icyBpbnRvIEluZGV4ZWREQi5cclxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL0xJQ0VOU0V8TUlUfVxyXG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL011YXpLaGFuLmNvbXxNdWF6IEtoYW59XHJcbiAqIEBleGFtcGxlXHJcbiAqIERpc2tTdG9yYWdlLlN0b3JlKHtcclxuICogICAgIGF1ZGlvQmxvYjogeW91ckF1ZGlvQmxvYixcclxuICogICAgIHZpZGVvQmxvYjogeW91clZpZGVvQmxvYixcclxuICogICAgIGdpZkJsb2IgIDogeW91ckdpZkJsb2JcclxuICogfSk7XHJcbiAqIERpc2tTdG9yYWdlLkZldGNoKGZ1bmN0aW9uKGRhdGFVUkwsIHR5cGUpIHtcclxuICogICAgIGlmKHR5cGUgPT09ICdhdWRpb0Jsb2InKSB7IH1cclxuICogICAgIGlmKHR5cGUgPT09ICd2aWRlb0Jsb2InKSB7IH1cclxuICogICAgIGlmKHR5cGUgPT09ICdnaWZCbG9iJykgICB7IH1cclxuICogfSk7XHJcbiAqIC8vIERpc2tTdG9yYWdlLmRhdGFTdG9yZU5hbWUgPSAncmVjb3JkUlRDJztcclxuICogLy8gRGlza1N0b3JhZ2Uub25FcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7IH07XHJcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGluaXQgLSBUaGlzIG1ldGhvZCBtdXN0IGJlIGNhbGxlZCBvbmNlIHRvIGluaXRpYWxpemUgSW5kZXhlZERCIE9iamVjdFN0b3JlLiBUaG91Z2gsIGl0IGlzIGF1dG8tdXNlZCBpbnRlcm5hbGx5LlxyXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBGZXRjaCAtIFRoaXMgbWV0aG9kIGZldGNoZXMgc3RvcmVkIGJsb2JzIGZyb20gSW5kZXhlZERCLlxyXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBTdG9yZSAtIFRoaXMgbWV0aG9kIHN0b3JlcyBibG9icyBpbiBJbmRleGVkREIuXHJcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IG9uRXJyb3IgLSBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgZm9yIGFueSBrbm93bi91bmtub3duIGVycm9yLlxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZGF0YVN0b3JlTmFtZSAtIE5hbWUgb2YgdGhlIE9iamVjdFN0b3JlIGNyZWF0ZWQgaW4gSW5kZXhlZERCIHN0b3JhZ2UuXHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICovXHJcblxyXG5cclxudmFyIERpc2tTdG9yYWdlID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBtdXN0IGJlIGNhbGxlZCBvbmNlIHRvIGluaXRpYWxpemUgSW5kZXhlZERCIE9iamVjdFN0b3JlLiBUaG91Z2gsIGl0IGlzIGF1dG8tdXNlZCBpbnRlcm5hbGx5LlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIERpc2tTdG9yYWdlXHJcbiAgICAgKiBAaW50ZXJuYWxcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBEaXNrU3RvcmFnZS5pbml0KCk7XHJcbiAgICAgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbmRleGVkREIgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBpbmRleGVkREIub3BlbiA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW5kZXhlZERCIEFQSSBhcmUgbm90IGF2YWlsYWJsZSBpbiB0aGlzIGJyb3dzZXIuJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYlZlcnNpb24gPSAxO1xyXG4gICAgICAgIHZhciBkYk5hbWUgPSB0aGlzLmRiTmFtZSB8fCBsb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1xcL3w6fCN8JXxcXC58XFxbfFxcXS9nLCAnJyksXHJcbiAgICAgICAgICAgIGRiO1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oZGJOYW1lLCBkYlZlcnNpb24pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVPYmplY3RTdG9yZShkYXRhQmFzZSkge1xyXG4gICAgICAgICAgICBkYXRhQmFzZS5jcmVhdGVPYmplY3RTdG9yZShzZWxmLmRhdGFTdG9yZU5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcHV0SW5EQigpIHtcclxuICAgICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oW3NlbGYuZGF0YVN0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxmLnZpZGVvQmxvYikge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc2VsZi5kYXRhU3RvcmVOYW1lKS5wdXQoc2VsZi52aWRlb0Jsb2IsICd2aWRlb0Jsb2InKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGYuZ2lmQmxvYikge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc2VsZi5kYXRhU3RvcmVOYW1lKS5wdXQoc2VsZi5naWZCbG9iLCAnZ2lmQmxvYicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2VsZi5hdWRpb0Jsb2IpIHtcclxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHNlbGYuZGF0YVN0b3JlTmFtZSkucHV0KHNlbGYuYXVkaW9CbG9iLCAnYXVkaW9CbG9iJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEZyb21TdG9yZShwb3J0aW9uTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc2VsZi5kYXRhU3RvcmVOYW1lKS5nZXQocG9ydGlvbk5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jYWxsYmFjayhldmVudC50YXJnZXQucmVzdWx0LCBwb3J0aW9uTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2V0RnJvbVN0b3JlKCdhdWRpb0Jsb2InKTtcclxuICAgICAgICAgICAgZ2V0RnJvbVN0b3JlKCd2aWRlb0Jsb2InKTtcclxuICAgICAgICAgICAgZ2V0RnJvbVN0b3JlKCdnaWZCbG9iJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBzZWxmLm9uRXJyb3I7XHJcblxyXG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGRiID0gcmVxdWVzdC5yZXN1bHQ7XHJcbiAgICAgICAgICAgIGRiLm9uZXJyb3IgPSBzZWxmLm9uRXJyb3I7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGIuc2V0VmVyc2lvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRiLnZlcnNpb24gIT09IGRiVmVyc2lvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXRWZXJzaW9uID0gZGIuc2V0VmVyc2lvbihkYlZlcnNpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFZlcnNpb24ub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU9iamVjdFN0b3JlKGRiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHV0SW5EQigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHB1dEluREIoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHB1dEluREIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBjcmVhdGVPYmplY3RTdG9yZShldmVudC50YXJnZXQucmVzdWx0KTtcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgZmV0Y2hlcyBzdG9yZWQgYmxvYnMgZnJvbSBJbmRleGVkREIuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgRGlza1N0b3JhZ2VcclxuICAgICAqIEBpbnRlcm5hbFxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIERpc2tTdG9yYWdlLkZldGNoKGZ1bmN0aW9uKGRhdGFVUkwsIHR5cGUpIHtcclxuICAgICAqICAgICBpZih0eXBlID09PSAnYXVkaW9CbG9iJykgeyB9XHJcbiAgICAgKiAgICAgaWYodHlwZSA9PT0gJ3ZpZGVvQmxvYicpIHsgfVxyXG4gICAgICogICAgIGlmKHR5cGUgPT09ICdnaWZCbG9iJykgICB7IH1cclxuICAgICAqIH0pO1xyXG4gICAgICovXHJcbiAgICBGZXRjaDogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcmVzIGJsb2JzIGluIEluZGV4ZWREQi5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBEaXNrU3RvcmFnZVxyXG4gICAgICogQGludGVybmFsXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogRGlza1N0b3JhZ2UuU3RvcmUoe1xyXG4gICAgICogICAgIGF1ZGlvQmxvYjogeW91ckF1ZGlvQmxvYixcclxuICAgICAqICAgICB2aWRlb0Jsb2I6IHlvdXJWaWRlb0Jsb2IsXHJcbiAgICAgKiAgICAgZ2lmQmxvYiAgOiB5b3VyR2lmQmxvYlxyXG4gICAgICogfSk7XHJcbiAgICAgKi9cclxuICAgIFN0b3JlOiBmdW5jdGlvbihjb25maWcpIHtcclxuICAgICAgICB0aGlzLmF1ZGlvQmxvYiA9IGNvbmZpZy5hdWRpb0Jsb2I7XHJcbiAgICAgICAgdGhpcy52aWRlb0Jsb2IgPSBjb25maWcudmlkZW9CbG9iO1xyXG4gICAgICAgIHRoaXMuZ2lmQmxvYiA9IGNvbmZpZy5naWZCbG9iO1xyXG5cclxuICAgICAgICB0aGlzLmluaXQoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgZm9yIGFueSBrbm93bi91bmtub3duIGVycm9yLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIERpc2tTdG9yYWdlXHJcbiAgICAgKiBAaW50ZXJuYWxcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBEaXNrU3RvcmFnZS5vbkVycm9yID0gZnVuY3Rpb24oZXJyb3Ipe1xyXG4gICAgICogICAgIGFsZXJvdCggSlNPTi5zdHJpbmdpZnkoZXJyb3IpICk7XHJcbiAgICAgKiB9O1xyXG4gICAgICovXHJcbiAgICBvbkVycm9yOiBmdW5jdGlvbihlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsICdcXHQnKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHByb3BlcnR5IHtzdHJpbmd9IGRhdGFTdG9yZU5hbWUgLSBOYW1lIG9mIHRoZSBPYmplY3RTdG9yZSBjcmVhdGVkIGluIEluZGV4ZWREQiBzdG9yYWdlLlxyXG4gICAgICogQG1lbWJlcm9mIERpc2tTdG9yYWdlXHJcbiAgICAgKiBAaW50ZXJuYWxcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBEaXNrU3RvcmFnZS5kYXRhU3RvcmVOYW1lID0gJ3JlY29yZFJUQyc7XHJcbiAgICAgKi9cclxuICAgIGRhdGFTdG9yZU5hbWU6ICdyZWNvcmRSVEMnLFxyXG4gICAgZGJOYW1lOiBudWxsXHJcbn07XHJcblxyXG5pZiAodHlwZW9mIFJlY29yZFJUQyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIFJlY29yZFJUQy5EaXNrU3RvcmFnZSA9IERpc2tTdG9yYWdlO1xyXG59XG5cclxuLy8gX19fX19fX19fX19fX19cclxuLy8gR2lmUmVjb3JkZXIuanNcclxuXHJcbi8qKlxyXG4gKiBHaWZSZWNvcmRlciBpcyBzdGFuZGFsb25lIGNhbHNzIHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gcmVjb3JkIHZpZGVvIG9yIGNhbnZhcyBpbnRvIGFuaW1hdGVkIGdpZi5cclxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL0xJQ0VOU0V8TUlUfVxyXG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL011YXpLaGFuLmNvbXxNdWF6IEtoYW59XHJcbiAqIEB0eXBlZGVmIEdpZlJlY29yZGVyXHJcbiAqIEBjbGFzc1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgR2lmUmVjb3JkZXIobWVkaWFTdHJlYW0gfHwgY2FudmFzIHx8IGNvbnRleHQsIHsgb25HaWZQcmV2aWV3OiBmdW5jdGlvbiwgb25HaWZSZWNvcmRpbmdTdGFydGVkOiBmdW5jdGlvbiwgd2lkdGg6IDEyODAsIGhlaWdodDogNzIwLCBmcmFtZVJhdGU6IDIwMCwgcXVhbGl0eTogMTAgfSk7XHJcbiAqIHJlY29yZGVyLnJlY29yZCgpO1xyXG4gKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcclxuICogICAgIGltZy5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gKiB9KTtcclxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEN8UmVjb3JkUlRDIFNvdXJjZSBDb2RlfVxyXG4gKiBAcGFyYW0ge01lZGlhU3RyZWFtfSBtZWRpYVN0cmVhbSAtIE1lZGlhU3RyZWFtIG9iamVjdCBvciBIVE1MQ2FudmFzRWxlbWVudCBvciBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgLSB7ZGlzYWJsZUxvZ3M6dHJ1ZSwgaW5pdENhbGxiYWNrOiBmdW5jdGlvbiwgd2lkdGg6IDMyMCwgaGVpZ2h0OiAyNDAsIGZyYW1lUmF0ZTogMjAwLCBxdWFsaXR5OiAxMH1cclxuICovXHJcblxyXG5mdW5jdGlvbiBHaWZSZWNvcmRlcihtZWRpYVN0cmVhbSwgY29uZmlnKSB7XHJcbiAgICBpZiAodHlwZW9mIEdJRkVuY29kZXIgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICAgIHNjcmlwdC5zcmMgPSAnaHR0cHM6Ly93d3cud2VicnRjLWV4cGVyaW1lbnQuY29tL2dpZi1yZWNvcmRlci5qcyc7XHJcbiAgICAgICAgKGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChzY3JpcHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHJcbiAgICB2YXIgaXNIVE1MT2JqZWN0ID0gbWVkaWFTdHJlYW0gaW5zdGFuY2VvZiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgfHwgbWVkaWFTdHJlYW0gaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlY29yZHMgTWVkaWFTdHJlYW0uXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgR2lmUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5yZWNvcmQoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5yZWNvcmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodHlwZW9mIEdJRkVuY29kZXIgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoc2VsZi5yZWNvcmQsIDEwMDApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlzTG9hZGVkTWV0YURhdGEpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChzZWxmLnJlY29yZCwgMTAwMCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNIVE1MT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLndpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcud2lkdGggPSB2aWRlby5vZmZzZXRXaWR0aCB8fCAzMjA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLmhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLmhlaWdodCA9IHZpZGVvLm9mZnNldEhlaWdodCB8fCAyNDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLnZpZGVvKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcudmlkZW8gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGNvbmZpZy53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGNvbmZpZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLmNhbnZhcykge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLmNhbnZhcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogY29uZmlnLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogY29uZmlnLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gY29uZmlnLmNhbnZhcy53aWR0aCB8fCAzMjA7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBjb25maWcuY2FudmFzLmhlaWdodCB8fCAyNDA7XHJcblxyXG4gICAgICAgICAgICB2aWRlby53aWR0aCA9IGNvbmZpZy52aWRlby53aWR0aCB8fCAzMjA7XHJcbiAgICAgICAgICAgIHZpZGVvLmhlaWdodCA9IGNvbmZpZy52aWRlby5oZWlnaHQgfHwgMjQwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZXh0ZXJuYWwgbGlicmFyeSB0byByZWNvcmQgYXMgR0lGIGltYWdlc1xyXG4gICAgICAgIGdpZkVuY29kZXIgPSBuZXcgR0lGRW5jb2RlcigpO1xyXG5cclxuICAgICAgICAvLyB2b2lkIHNldFJlcGVhdChpbnQgaXRlcikgXHJcbiAgICAgICAgLy8gU2V0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBzZXQgb2YgR0lGIGZyYW1lcyBzaG91bGQgYmUgcGxheWVkLiBcclxuICAgICAgICAvLyBEZWZhdWx0IGlzIDE7IDAgbWVhbnMgcGxheSBpbmRlZmluaXRlbHkuXHJcbiAgICAgICAgZ2lmRW5jb2Rlci5zZXRSZXBlYXQoMCk7XHJcblxyXG4gICAgICAgIC8vIHZvaWQgc2V0RnJhbWVSYXRlKE51bWJlciBmcHMpIFxyXG4gICAgICAgIC8vIFNldHMgZnJhbWUgcmF0ZSBpbiBmcmFtZXMgcGVyIHNlY29uZC4gXHJcbiAgICAgICAgLy8gRXF1aXZhbGVudCB0byBzZXREZWxheSgxMDAwL2ZwcykuXHJcbiAgICAgICAgLy8gVXNpbmcgXCJzZXREZWxheVwiIGluc3RlYWQgb2YgXCJzZXRGcmFtZVJhdGVcIlxyXG4gICAgICAgIGdpZkVuY29kZXIuc2V0RGVsYXkoY29uZmlnLmZyYW1lUmF0ZSB8fCAyMDApO1xyXG5cclxuICAgICAgICAvLyB2b2lkIHNldFF1YWxpdHkoaW50IHF1YWxpdHkpIFxyXG4gICAgICAgIC8vIFNldHMgcXVhbGl0eSBvZiBjb2xvciBxdWFudGl6YXRpb24gKGNvbnZlcnNpb24gb2YgaW1hZ2VzIHRvIHRoZSBcclxuICAgICAgICAvLyBtYXhpbXVtIDI1NiBjb2xvcnMgYWxsb3dlZCBieSB0aGUgR0lGIHNwZWNpZmljYXRpb24pLiBcclxuICAgICAgICAvLyBMb3dlciB2YWx1ZXMgKG1pbmltdW0gPSAxKSBwcm9kdWNlIGJldHRlciBjb2xvcnMsIFxyXG4gICAgICAgIC8vIGJ1dCBzbG93IHByb2Nlc3Npbmcgc2lnbmlmaWNhbnRseS4gMTAgaXMgdGhlIGRlZmF1bHQsIFxyXG4gICAgICAgIC8vIGFuZCBwcm9kdWNlcyBnb29kIGNvbG9yIG1hcHBpbmcgYXQgcmVhc29uYWJsZSBzcGVlZHMuIFxyXG4gICAgICAgIC8vIFZhbHVlcyBncmVhdGVyIHRoYW4gMjAgZG8gbm90IHlpZWxkIHNpZ25pZmljYW50IGltcHJvdmVtZW50cyBpbiBzcGVlZC5cclxuICAgICAgICBnaWZFbmNvZGVyLnNldFF1YWxpdHkoY29uZmlnLnF1YWxpdHkgfHwgMTApO1xyXG5cclxuICAgICAgICAvLyBCb29sZWFuIHN0YXJ0KCkgXHJcbiAgICAgICAgLy8gVGhpcyB3cml0ZXMgdGhlIEdJRiBIZWFkZXIgYW5kIHJldHVybnMgZmFsc2UgaWYgaXQgZmFpbHMuXHJcbiAgICAgICAgZ2lmRW5jb2Rlci5zdGFydCgpO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vbkdpZlJlY29yZGluZ1N0YXJ0ZWQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgY29uZmlnLm9uR2lmUmVjb3JkaW5nU3RhcnRlZCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZHJhd1ZpZGVvRnJhbWUodGltZSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5jbGVhcmVkUmVjb3JkZWREYXRhID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1BhdXNlZFJlY29yZGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhd1ZpZGVvRnJhbWUodGltZSk7XHJcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsYXN0QW5pbWF0aW9uRnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd1ZpZGVvRnJhbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBsYXN0RnJhbWVUaW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGxhc3RGcmFtZVRpbWUgPSB0aW1lO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB+MTAgZnBzXHJcbiAgICAgICAgICAgIGlmICh0aW1lIC0gbGFzdEZyYW1lVGltZSA8IDkwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghaXNIVE1MT2JqZWN0ICYmIHZpZGVvLnBhdXNlZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gdmlhOiBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1dlYlJUQy1FeHBlcmltZW50L3B1bGwvMzE2XHJcbiAgICAgICAgICAgICAgICAvLyBUd2VhayBmb3IgQW5kcm9pZCBDaHJvbWVcclxuICAgICAgICAgICAgICAgIHZpZGVvLnBsYXkoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFpc0hUTUxPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY29uZmlnLm9uR2lmUHJldmlldykge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLm9uR2lmUHJldmlldyhjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdpZkVuY29kZXIuYWRkRnJhbWUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIGxhc3RGcmFtZVRpbWUgPSB0aW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGFzdEFuaW1hdGlvbkZyYW1lID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdWaWRlb0ZyYW1lKTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5pbml0Q2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY29uZmlnLmluaXRDYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyByZWNvcmRpbmcgTWVkaWFTdHJlYW0uXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uLCB0aGF0IGlzIHVzZWQgdG8gcGFzcyByZWNvcmRlZCBibG9iIGJhY2sgdG8gdGhlIGNhbGxlZS5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBHaWZSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gICAgICogICAgIGltZy5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICogfSk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xyXG5cclxuICAgICAgICBpZiAobGFzdEFuaW1hdGlvbkZyYW1lKSB7XHJcbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGxhc3RBbmltYXRpb25GcmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbmRUaW1lID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHByb3BlcnR5IHtCbG9ifSBibG9iIC0gVGhlIHJlY29yZGVkIGJsb2Igb2JqZWN0LlxyXG4gICAgICAgICAqIEBtZW1iZXJvZiBHaWZSZWNvcmRlclxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbigpe1xyXG4gICAgICAgICAqICAgICB2YXIgYmxvYiA9IHJlY29yZGVyLmJsb2I7XHJcbiAgICAgICAgICogfSk7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5ibG9iID0gbmV3IEJsb2IoW25ldyBVaW50OEFycmF5KGdpZkVuY29kZXIuc3RyZWFtKCkuYmluKV0sIHtcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL2dpZidcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY2FsbGJhY2sodGhpcy5ibG9iKTtcclxuXHJcbiAgICAgICAgLy8gYnVnOiBmaW5kIGEgd2F5IHRvIGNsZWFyIG9sZCByZWNvcmRlZCBibG9ic1xyXG4gICAgICAgIGdpZkVuY29kZXIuc3RyZWFtKCkuYmluID0gW107XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBpc1BhdXNlZFJlY29yZGluZyA9IGZhbHNlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcGF1c2VzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBHaWZSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnBhdXNlKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpc1BhdXNlZFJlY29yZGluZyA9IHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgR2lmUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5yZXN1bWUoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpc1BhdXNlZFJlY29yZGluZyA9IGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlc2V0cyBjdXJyZW50bHkgcmVjb3JkZWQgZGF0YS5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBHaWZSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLmNsZWFyUmVjb3JkZWREYXRhKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuY2xlYXJSZWNvcmRlZERhdGEgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBzZWxmLmNsZWFyZWRSZWNvcmRlZERhdGEgPSB0cnVlO1xyXG4gICAgICAgIGNsZWFyUmVjb3JkZWREYXRhQ0IoKTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYXJSZWNvcmRlZERhdGFDQigpIHtcclxuICAgICAgICBpZiAoZ2lmRW5jb2Rlcikge1xyXG4gICAgICAgICAgICBnaWZFbmNvZGVyLnN0cmVhbSgpLmJpbiA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBmb3IgZGVidWdnaW5nXHJcbiAgICB0aGlzLm5hbWUgPSAnR2lmUmVjb3JkZXInO1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgaWYgKGlzSFRNTE9iamVjdCkge1xyXG4gICAgICAgIGlmIChtZWRpYVN0cmVhbSBpbnN0YW5jZW9mIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgICAgICBjb250ZXh0ID0gbWVkaWFTdHJlYW07XHJcbiAgICAgICAgICAgIGNhbnZhcyA9IGNvbnRleHQuY2FudmFzO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobWVkaWFTdHJlYW0gaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xyXG4gICAgICAgICAgICBjb250ZXh0ID0gbWVkaWFTdHJlYW0uZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgY2FudmFzID0gbWVkaWFTdHJlYW07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBpc0xvYWRlZE1ldGFEYXRhID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoIWlzSFRNTE9iamVjdCkge1xyXG4gICAgICAgIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XHJcbiAgICAgICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHZpZGVvLmF1dG9wbGF5ID0gdHJ1ZTtcclxuICAgICAgICB2aWRlby5wbGF5c0lubGluZSA9IHRydWU7XHJcblxyXG4gICAgICAgIGlzTG9hZGVkTWV0YURhdGEgPSBmYWxzZTtcclxuICAgICAgICB2aWRlby5vbmxvYWRlZG1ldGFkYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlzTG9hZGVkTWV0YURhdGEgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNldFNyY09iamVjdChtZWRpYVN0cmVhbSwgdmlkZW8pO1xyXG5cclxuICAgICAgICB2aWRlby5wbGF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxhc3RBbmltYXRpb25GcmFtZSA9IG51bGw7XHJcbiAgICB2YXIgc3RhcnRUaW1lLCBlbmRUaW1lLCBsYXN0RnJhbWVUaW1lO1xyXG5cclxuICAgIHZhciBnaWZFbmNvZGVyO1xyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxufVxyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBSZWNvcmRSVEMuR2lmUmVjb3JkZXIgPSBHaWZSZWNvcmRlcjtcclxufVxuXHJcbi8vIExhc3QgdGltZSB1cGRhdGVkOiAyMDE5LTA2LTIxIDQ6MDk6NDIgQU0gVVRDXHJcblxyXG4vLyBfX19fX19fX19fX19fX19fX19fX19fX19cclxuLy8gTXVsdGlTdHJlYW1zTWl4ZXIgdjEuMi4yXHJcblxyXG4vLyBPcGVuLVNvdXJjZWQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vTXVsdGlTdHJlYW1zTWl4ZXJcclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIE11YXogS2hhbiAgICAgLSB3d3cuTXVhektoYW4uY29tXHJcbi8vIE1JVCBMaWNlbnNlICAgLSB3d3cuV2ViUlRDLUV4cGVyaW1lbnQuY29tL2xpY2VuY2VcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbmZ1bmN0aW9uIE11bHRpU3RyZWFtc01peGVyKGFycmF5T2ZNZWRpYVN0cmVhbXMsIGVsZW1lbnRDbGFzcykge1xyXG5cclxuICAgIHZhciBicm93c2VyRmFrZVVzZXJBZ2VudCA9ICdGYWtlLzUuMCAoRmFrZU9TKSBBcHBsZVdlYktpdC8xMjMgKEtIVE1MLCBsaWtlIEdlY2tvKSBGYWtlLzEyLjMuNDU2Ny44OSBGYWtlLzEyMy40NSc7XHJcblxyXG4gICAgKGZ1bmN0aW9uKHRoYXQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIFJlY29yZFJUQyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGF0KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGdsb2JhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2xvYmFsLm5hdmlnYXRvciA9IHtcclxuICAgICAgICAgICAgdXNlckFnZW50OiBicm93c2VyRmFrZVVzZXJBZ2VudCxcclxuICAgICAgICAgICAgZ2V0VXNlck1lZGlhOiBmdW5jdGlvbigpIHt9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCFnbG9iYWwuY29uc29sZSkge1xyXG4gICAgICAgICAgICBnbG9iYWwuY29uc29sZSA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBnbG9iYWwuY29uc29sZS5sb2cgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBnbG9iYWwuY29uc29sZS5lcnJvciA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUuZXJyb3IgPSBnbG9iYWwuY29uc29sZS5sb2cgPSBnbG9iYWwuY29uc29sZS5sb2cgfHwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgLypnbG9iYWwgZG9jdW1lbnQ6dHJ1ZSAqL1xyXG4gICAgICAgICAgICB0aGF0LmRvY3VtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnRFbGVtZW50OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9IGRvY3VtZW50LmNhcHR1cmVTdHJlYW0gPSBkb2N1bWVudC5tb3pDYXB0dXJlU3RyZWFtID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGdldENvbnRleHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcGxheTogZnVuY3Rpb24oKSB7fSxcclxuICAgICAgICAgICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24oKSB7fSxcclxuICAgICAgICAgICAgICAgICAgICBkcmF3SW1hZ2U6IGZ1bmN0aW9uKCkge30sXHJcbiAgICAgICAgICAgICAgICAgICAgdG9EYXRhVVJMOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHt9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoYXQuSFRNTFZpZGVvRWxlbWVudCA9IGZ1bmN0aW9uKCkge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGxvY2F0aW9uID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAvKmdsb2JhbCBsb2NhdGlvbjp0cnVlICovXHJcbiAgICAgICAgICAgIHRoYXQubG9jYXRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogJ2ZpbGU6JyxcclxuICAgICAgICAgICAgICAgIGhyZWY6ICcnLFxyXG4gICAgICAgICAgICAgICAgaGFzaDogJydcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc2NyZWVuID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAvKmdsb2JhbCBzY3JlZW46dHJ1ZSAqL1xyXG4gICAgICAgICAgICB0aGF0LnNjcmVlbiA9IHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIFVSTCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgLypnbG9iYWwgc2NyZWVuOnRydWUgKi9cclxuICAgICAgICAgICAgdGhhdC5VUkwgPSB7XHJcbiAgICAgICAgICAgICAgICBjcmVhdGVPYmplY3RVUkw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZXZva2VPYmplY3RVUkw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qZ2xvYmFsIHdpbmRvdzp0cnVlICovXHJcbiAgICAgICAgdGhhdC53aW5kb3cgPSBnbG9iYWw7XHJcbiAgICB9KSh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IG51bGwpO1xyXG5cclxuICAgIC8vIHJlcXVpcmVzOiBjaHJvbWU6Ly9mbGFncy8jZW5hYmxlLWV4cGVyaW1lbnRhbC13ZWItcGxhdGZvcm0tZmVhdHVyZXNcclxuXHJcbiAgICBlbGVtZW50Q2xhc3MgPSBlbGVtZW50Q2xhc3MgfHwgJ211bHRpLXN0cmVhbXMtbWl4ZXInO1xyXG5cclxuICAgIHZhciB2aWRlb3MgPSBbXTtcclxuICAgIHZhciBpc1N0b3BEcmF3aW5nRnJhbWVzID0gZmFsc2U7XHJcblxyXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIGNhbnZhcy5zdHlsZS5vcGFjaXR5ID0gMDtcclxuICAgIGNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICBjYW52YXMuc3R5bGUuekluZGV4ID0gLTE7XHJcbiAgICBjYW52YXMuc3R5bGUudG9wID0gJy0xMDAwZW0nO1xyXG4gICAgY2FudmFzLnN0eWxlLmxlZnQgPSAnLTEwMDBlbSc7XHJcbiAgICBjYW52YXMuY2xhc3NOYW1lID0gZWxlbWVudENsYXNzO1xyXG4gICAgKGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChjYW52YXMpO1xyXG5cclxuICAgIHRoaXMuZGlzYWJsZUxvZ3MgPSBmYWxzZTtcclxuICAgIHRoaXMuZnJhbWVJbnRlcnZhbCA9IDEwO1xyXG5cclxuICAgIHRoaXMud2lkdGggPSAzNjA7XHJcbiAgICB0aGlzLmhlaWdodCA9IDI0MDtcclxuXHJcbiAgICAvLyB1c2UgZ2FpbiBub2RlIHRvIHByZXZlbnQgZWNob1xyXG4gICAgdGhpcy51c2VHYWluTm9kZSA9IHRydWU7XHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIC8vIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fXHJcbiAgICAvLyBDcm9zcy1Ccm93c2VyLURlY2xhcmF0aW9ucy5qc1xyXG5cclxuICAgIC8vIFdlYkF1ZGlvIEFQSSByZXByZXNlbnRlclxyXG4gICAgdmFyIEF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQ7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBBdWRpb0NvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB3ZWJraXRBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIC8qZ2xvYmFsIEF1ZGlvQ29udGV4dDp0cnVlICovXHJcbiAgICAgICAgICAgIEF1ZGlvQ29udGV4dCA9IHdlYmtpdEF1ZGlvQ29udGV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbW96QXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAvKmdsb2JhbCBBdWRpb0NvbnRleHQ6dHJ1ZSAqL1xyXG4gICAgICAgICAgICBBdWRpb0NvbnRleHQgPSBtb3pBdWRpb0NvbnRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qanNoaW50IC1XMDc5ICovXHJcbiAgICB2YXIgVVJMID0gd2luZG93LlVSTDtcclxuXHJcbiAgICBpZiAodHlwZW9mIFVSTCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdlYmtpdFVSTCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvKmdsb2JhbCBVUkw6dHJ1ZSAqL1xyXG4gICAgICAgIFVSTCA9IHdlYmtpdFVSTDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPT09ICd1bmRlZmluZWQnKSB7IC8vIG1heWJlIHdpbmRvdy5uYXZpZ2F0b3I/XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBNZWRpYVN0cmVhbSA9IHdpbmRvdy5NZWRpYVN0cmVhbTtcclxuXHJcbiAgICBpZiAodHlwZW9mIE1lZGlhU3RyZWFtID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2Via2l0TWVkaWFTdHJlYW0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgTWVkaWFTdHJlYW0gPSB3ZWJraXRNZWRpYVN0cmVhbTtcclxuICAgIH1cclxuXHJcbiAgICAvKmdsb2JhbCBNZWRpYVN0cmVhbTp0cnVlICovXHJcbiAgICBpZiAodHlwZW9mIE1lZGlhU3RyZWFtICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8vIG92ZXJyaWRlIFwic3RvcFwiIG1ldGhvZCBmb3IgYWxsIGJyb3dzZXJzXHJcbiAgICAgICAgaWYgKHR5cGVvZiBNZWRpYVN0cmVhbS5wcm90b3R5cGUuc3RvcCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgTWVkaWFTdHJlYW0ucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VHJhY2tzKCkuZm9yRWFjaChmdW5jdGlvbih0cmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYWNrLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgU3RvcmFnZSA9IHt9O1xyXG5cclxuICAgIGlmICh0eXBlb2YgQXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIFN0b3JhZ2UuQXVkaW9Db250ZXh0ID0gQXVkaW9Db250ZXh0O1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2Via2l0QXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIFN0b3JhZ2UuQXVkaW9Db250ZXh0ID0gd2Via2l0QXVkaW9Db250ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldFNyY09iamVjdChzdHJlYW0sIGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAoJ3NyY09iamVjdCcgaW4gZWxlbWVudCkge1xyXG4gICAgICAgICAgICBlbGVtZW50LnNyY09iamVjdCA9IHN0cmVhbTtcclxuICAgICAgICB9IGVsc2UgaWYgKCdtb3pTcmNPYmplY3QnIGluIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5tb3pTcmNPYmplY3QgPSBzdHJlYW07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWxlbWVudC5zcmNPYmplY3QgPSBzdHJlYW07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3RhcnREcmF3aW5nRnJhbWVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgZHJhd1ZpZGVvc1RvQ2FudmFzKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdWaWRlb3NUb0NhbnZhcygpIHtcclxuICAgICAgICBpZiAoaXNTdG9wRHJhd2luZ0ZyYW1lcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdmlkZW9zTGVuZ3RoID0gdmlkZW9zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgdmFyIGZ1bGxjYW52YXMgPSBmYWxzZTtcclxuICAgICAgICB2YXIgcmVtYWluaW5nID0gW107XHJcbiAgICAgICAgdmlkZW9zLmZvckVhY2goZnVuY3Rpb24odmlkZW8pIHtcclxuICAgICAgICAgICAgaWYgKCF2aWRlby5zdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgIHZpZGVvLnN0cmVhbSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmlkZW8uc3RyZWFtLmZ1bGxjYW52YXMpIHtcclxuICAgICAgICAgICAgICAgIGZ1bGxjYW52YXMgPSB2aWRlbztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHRvZG86IHZpZGVvLnN0cmVhbS5hY3RpdmUgb3IgdmlkZW8uc3RyZWFtLmxpdmUgdG8gZml4IGJsYW5rIGZyYW1lcyBpc3N1ZXM/XHJcbiAgICAgICAgICAgICAgICByZW1haW5pbmcucHVzaCh2aWRlbyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGZ1bGxjYW52YXMpIHtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gZnVsbGNhbnZhcy5zdHJlYW0ud2lkdGg7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBmdWxsY2FudmFzLnN0cmVhbS5oZWlnaHQ7XHJcbiAgICAgICAgfSBlbHNlIGlmIChyZW1haW5pbmcubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZGVvc0xlbmd0aCA+IDEgPyByZW1haW5pbmdbMF0ud2lkdGggKiAyIDogcmVtYWluaW5nWzBdLndpZHRoO1xyXG5cclxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IDE7XHJcbiAgICAgICAgICAgIGlmICh2aWRlb3NMZW5ndGggPT09IDMgfHwgdmlkZW9zTGVuZ3RoID09PSA0KSB7XHJcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh2aWRlb3NMZW5ndGggPT09IDUgfHwgdmlkZW9zTGVuZ3RoID09PSA2KSB7XHJcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh2aWRlb3NMZW5ndGggPT09IDcgfHwgdmlkZW9zTGVuZ3RoID09PSA4KSB7XHJcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSA0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh2aWRlb3NMZW5ndGggPT09IDkgfHwgdmlkZW9zTGVuZ3RoID09PSAxMCkge1xyXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gNTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gcmVtYWluaW5nWzBdLmhlaWdodCAqIGhlaWdodDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBzZWxmLndpZHRoIHx8IDM2MDtcclxuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHNlbGYuaGVpZ2h0IHx8IDI0MDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmdWxsY2FudmFzICYmIGZ1bGxjYW52YXMgaW5zdGFuY2VvZiBIVE1MVmlkZW9FbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGRyYXdJbWFnZShmdWxsY2FudmFzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbWFpbmluZy5mb3JFYWNoKGZ1bmN0aW9uKHZpZGVvLCBpZHgpIHtcclxuICAgICAgICAgICAgZHJhd0ltYWdlKHZpZGVvLCBpZHgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGRyYXdWaWRlb3NUb0NhbnZhcywgc2VsZi5mcmFtZUludGVydmFsKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3SW1hZ2UodmlkZW8sIGlkeCkge1xyXG4gICAgICAgIGlmIChpc1N0b3BEcmF3aW5nRnJhbWVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4ID0gMDtcclxuICAgICAgICB2YXIgeSA9IDA7XHJcbiAgICAgICAgdmFyIHdpZHRoID0gdmlkZW8ud2lkdGg7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IHZpZGVvLmhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKGlkeCA9PT0gMSkge1xyXG4gICAgICAgICAgICB4ID0gdmlkZW8ud2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaWR4ID09PSAyKSB7XHJcbiAgICAgICAgICAgIHkgPSB2aWRlby5oZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaWR4ID09PSAzKSB7XHJcbiAgICAgICAgICAgIHggPSB2aWRlby53aWR0aDtcclxuICAgICAgICAgICAgeSA9IHZpZGVvLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpZHggPT09IDQpIHtcclxuICAgICAgICAgICAgeSA9IHZpZGVvLmhlaWdodCAqIDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaWR4ID09PSA1KSB7XHJcbiAgICAgICAgICAgIHggPSB2aWRlby53aWR0aDtcclxuICAgICAgICAgICAgeSA9IHZpZGVvLmhlaWdodCAqIDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaWR4ID09PSA2KSB7XHJcbiAgICAgICAgICAgIHkgPSB2aWRlby5oZWlnaHQgKiAzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlkeCA9PT0gNykge1xyXG4gICAgICAgICAgICB4ID0gdmlkZW8ud2lkdGg7XHJcbiAgICAgICAgICAgIHkgPSB2aWRlby5oZWlnaHQgKiAzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB2aWRlby5zdHJlYW0ubGVmdCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgeCA9IHZpZGVvLnN0cmVhbS5sZWZ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB2aWRlby5zdHJlYW0udG9wICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB5ID0gdmlkZW8uc3RyZWFtLnRvcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgdmlkZW8uc3RyZWFtLndpZHRoICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB3aWR0aCA9IHZpZGVvLnN0cmVhbS53aWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgdmlkZW8uc3RyZWFtLmhlaWdodCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgaGVpZ2h0ID0gdmlkZW8uc3RyZWFtLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHZpZGVvLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB2aWRlby5zdHJlYW0ub25SZW5kZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdmlkZW8uc3RyZWFtLm9uUmVuZGVyKGNvbnRleHQsIHgsIHksIHdpZHRoLCBoZWlnaHQsIGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldE1peGVkU3RyZWFtKCkge1xyXG4gICAgICAgIGlzU3RvcERyYXdpbmdGcmFtZXMgPSBmYWxzZTtcclxuICAgICAgICB2YXIgbWl4ZWRWaWRlb1N0cmVhbSA9IGdldE1peGVkVmlkZW9TdHJlYW0oKTtcclxuXHJcbiAgICAgICAgdmFyIG1peGVkQXVkaW9TdHJlYW0gPSBnZXRNaXhlZEF1ZGlvU3RyZWFtKCk7XHJcbiAgICAgICAgaWYgKG1peGVkQXVkaW9TdHJlYW0pIHtcclxuICAgICAgICAgICAgbWl4ZWRBdWRpb1N0cmVhbS5nZXRUcmFja3MoKS5maWx0ZXIoZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQua2luZCA9PT0gJ2F1ZGlvJztcclxuICAgICAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbih0cmFjaykge1xyXG4gICAgICAgICAgICAgICAgbWl4ZWRWaWRlb1N0cmVhbS5hZGRUcmFjayh0cmFjayk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZ1bGxjYW52YXM7XHJcbiAgICAgICAgYXJyYXlPZk1lZGlhU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uKHN0cmVhbSkge1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmZ1bGxjYW52YXMpIHtcclxuICAgICAgICAgICAgICAgIGZ1bGxjYW52YXMgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIG1peGVkVmlkZW9TdHJlYW0ucHJvdG90eXBlLmFwcGVuZFN0cmVhbXMgPSBhcHBlbmRTdHJlYW1zO1xyXG4gICAgICAgIC8vIG1peGVkVmlkZW9TdHJlYW0ucHJvdG90eXBlLnJlc2V0VmlkZW9TdHJlYW1zID0gcmVzZXRWaWRlb1N0cmVhbXM7XHJcbiAgICAgICAgLy8gbWl4ZWRWaWRlb1N0cmVhbS5wcm90b3R5cGUuY2xlYXJSZWNvcmRlZERhdGEgPSBjbGVhclJlY29yZGVkRGF0YTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1peGVkVmlkZW9TdHJlYW07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0TWl4ZWRWaWRlb1N0cmVhbSgpIHtcclxuICAgICAgICByZXNldFZpZGVvU3RyZWFtcygpO1xyXG5cclxuICAgICAgICB2YXIgY2FwdHVyZWRTdHJlYW07XHJcblxyXG4gICAgICAgIGlmICgnY2FwdHVyZVN0cmVhbScgaW4gY2FudmFzKSB7XHJcbiAgICAgICAgICAgIGNhcHR1cmVkU3RyZWFtID0gY2FudmFzLmNhcHR1cmVTdHJlYW0oKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCdtb3pDYXB0dXJlU3RyZWFtJyBpbiBjYW52YXMpIHtcclxuICAgICAgICAgICAgY2FwdHVyZWRTdHJlYW0gPSBjYW52YXMubW96Q2FwdHVyZVN0cmVhbSgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXNlbGYuZGlzYWJsZUxvZ3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignVXBncmFkZSB0byBsYXRlc3QgQ2hyb21lIG9yIG90aGVyd2lzZSBlbmFibGUgdGhpcyBmbGFnOiBjaHJvbWU6Ly9mbGFncy8jZW5hYmxlLWV4cGVyaW1lbnRhbC13ZWItcGxhdGZvcm0tZmVhdHVyZXMnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB2aWRlb1N0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xyXG5cclxuICAgICAgICBjYXB0dXJlZFN0cmVhbS5nZXRUcmFja3MoKS5maWx0ZXIoZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdC5raW5kID09PSAndmlkZW8nO1xyXG4gICAgICAgIH0pLmZvckVhY2goZnVuY3Rpb24odHJhY2spIHtcclxuICAgICAgICAgICAgdmlkZW9TdHJlYW0uYWRkVHJhY2sodHJhY2spO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjYW52YXMuc3RyZWFtID0gdmlkZW9TdHJlYW07XHJcblxyXG4gICAgICAgIHJldHVybiB2aWRlb1N0cmVhbTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRNaXhlZEF1ZGlvU3RyZWFtKCkge1xyXG4gICAgICAgIC8vIHZpYTogQHBlaHJzb25zXHJcbiAgICAgICAgaWYgKCFTdG9yYWdlLkF1ZGlvQ29udGV4dENvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgIFN0b3JhZ2UuQXVkaW9Db250ZXh0Q29uc3RydWN0b3IgPSBuZXcgU3RvcmFnZS5BdWRpb0NvbnRleHQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYuYXVkaW9Db250ZXh0ID0gU3RvcmFnZS5BdWRpb0NvbnRleHRDb25zdHJ1Y3RvcjtcclxuXHJcbiAgICAgICAgc2VsZi5hdWRpb1NvdXJjZXMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGYudXNlR2Fpbk5vZGUgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgc2VsZi5nYWluTm9kZSA9IHNlbGYuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICAgICAgICAgICAgc2VsZi5nYWluTm9kZS5jb25uZWN0KHNlbGYuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcclxuICAgICAgICAgICAgc2VsZi5nYWluTm9kZS5nYWluLnZhbHVlID0gMDsgLy8gZG9uJ3QgaGVhciBzZWxmXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYXVkaW9UcmFja3NMZW5ndGggPSAwO1xyXG4gICAgICAgIGFycmF5T2ZNZWRpYVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcclxuICAgICAgICAgICAgaWYgKCFzdHJlYW0uZ2V0VHJhY2tzKCkuZmlsdGVyKGZ1bmN0aW9uKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdC5raW5kID09PSAnYXVkaW8nO1xyXG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGF1ZGlvVHJhY2tzTGVuZ3RoKys7XHJcblxyXG4gICAgICAgICAgICB2YXIgYXVkaW9Tb3VyY2UgPSBzZWxmLmF1ZGlvQ29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShzdHJlYW0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGYudXNlR2Fpbk5vZGUgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGF1ZGlvU291cmNlLmNvbm5lY3Qoc2VsZi5nYWluTm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuYXVkaW9Tb3VyY2VzLnB1c2goYXVkaW9Tb3VyY2UpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWF1ZGlvVHJhY2tzTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgXCJzZWxmLmF1ZGlvQ29udGV4dFwiIGlzIG5vdCBpbml0aWFsaXplZFxyXG4gICAgICAgICAgICAvLyB0aGF0J3Mgd2h5IHdlJ3ZlIHRvIGlnbm9yZSByZXN0IG9mIHRoZSBjb2RlXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYuYXVkaW9EZXN0aW5hdGlvbiA9IHNlbGYuYXVkaW9Db250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtRGVzdGluYXRpb24oKTtcclxuICAgICAgICBzZWxmLmF1ZGlvU291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uKGF1ZGlvU291cmNlKSB7XHJcbiAgICAgICAgICAgIGF1ZGlvU291cmNlLmNvbm5lY3Qoc2VsZi5hdWRpb0Rlc3RpbmF0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gc2VsZi5hdWRpb0Rlc3RpbmF0aW9uLnN0cmVhbTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRWaWRlbyhzdHJlYW0pIHtcclxuICAgICAgICB2YXIgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xyXG5cclxuICAgICAgICBzZXRTcmNPYmplY3Qoc3RyZWFtLCB2aWRlbyk7XHJcblxyXG4gICAgICAgIHZpZGVvLmNsYXNzTmFtZSA9IGVsZW1lbnRDbGFzcztcclxuXHJcbiAgICAgICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHZpZGVvLnZvbHVtZSA9IDA7XHJcblxyXG4gICAgICAgIHZpZGVvLndpZHRoID0gc3RyZWFtLndpZHRoIHx8IHNlbGYud2lkdGggfHwgMzYwO1xyXG4gICAgICAgIHZpZGVvLmhlaWdodCA9IHN0cmVhbS5oZWlnaHQgfHwgc2VsZi5oZWlnaHQgfHwgMjQwO1xyXG5cclxuICAgICAgICB2aWRlby5wbGF5KCk7XHJcblxyXG4gICAgICAgIHJldHVybiB2aWRlbztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmFwcGVuZFN0cmVhbXMgPSBmdW5jdGlvbihzdHJlYW1zKSB7XHJcbiAgICAgICAgaWYgKCFzdHJlYW1zKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdGaXJzdCBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghKHN0cmVhbXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICAgICAgc3RyZWFtcyA9IFtzdHJlYW1zXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcclxuICAgICAgICAgICAgdmFyIG5ld1N0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5nZXRUcmFja3MoKS5maWx0ZXIoZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0LmtpbmQgPT09ICd2aWRlbyc7XHJcbiAgICAgICAgICAgICAgICB9KS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2aWRlbyA9IGdldFZpZGVvKHN0cmVhbSk7XHJcbiAgICAgICAgICAgICAgICB2aWRlby5zdHJlYW0gPSBzdHJlYW07XHJcbiAgICAgICAgICAgICAgICB2aWRlb3MucHVzaCh2aWRlbyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3U3RyZWFtLmFkZFRyYWNrKHN0cmVhbS5nZXRUcmFja3MoKS5maWx0ZXIoZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0LmtpbmQgPT09ICd2aWRlbyc7XHJcbiAgICAgICAgICAgICAgICB9KVswXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uZ2V0VHJhY2tzKCkuZmlsdGVyKGZ1bmN0aW9uKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdC5raW5kID09PSAnYXVkaW8nO1xyXG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXVkaW9Tb3VyY2UgPSBzZWxmLmF1ZGlvQ29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShzdHJlYW0pO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hdWRpb0Rlc3RpbmF0aW9uID0gc2VsZi5hdWRpb0NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1EZXN0aW5hdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgYXVkaW9Tb3VyY2UuY29ubmVjdChzZWxmLmF1ZGlvRGVzdGluYXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIG5ld1N0cmVhbS5hZGRUcmFjayhzZWxmLmF1ZGlvRGVzdGluYXRpb24uc3RyZWFtLmdldFRyYWNrcygpLmZpbHRlcihmdW5jdGlvbih0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQua2luZCA9PT0gJ2F1ZGlvJztcclxuICAgICAgICAgICAgICAgIH0pWzBdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYXJyYXlPZk1lZGlhU3RyZWFtcy5wdXNoKG5ld1N0cmVhbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVsZWFzZVN0cmVhbXMgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2aWRlb3MgPSBbXTtcclxuICAgICAgICBpc1N0b3BEcmF3aW5nRnJhbWVzID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGYuZ2Fpbk5vZGUpIHtcclxuICAgICAgICAgICAgc2VsZi5nYWluTm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgIHNlbGYuZ2Fpbk5vZGUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNlbGYuYXVkaW9Tb3VyY2VzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBzZWxmLmF1ZGlvU291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgc291cmNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNlbGYuYXVkaW9Tb3VyY2VzID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5hdWRpb0Rlc3RpbmF0aW9uKSB7XHJcbiAgICAgICAgICAgIHNlbGYuYXVkaW9EZXN0aW5hdGlvbi5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgIHNlbGYuYXVkaW9EZXN0aW5hdGlvbiA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5hdWRpb0NvbnRleHQpIHtcclxuICAgICAgICAgICAgc2VsZi5hdWRpb0NvbnRleHQuY2xvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYuYXVkaW9Db250ZXh0ID0gbnVsbDtcclxuXHJcbiAgICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgaWYgKGNhbnZhcy5zdHJlYW0pIHtcclxuICAgICAgICAgICAgY2FudmFzLnN0cmVhbS5zdG9wKCk7XHJcbiAgICAgICAgICAgIGNhbnZhcy5zdHJlYW0gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZXNldFZpZGVvU3RyZWFtcyA9IGZ1bmN0aW9uKHN0cmVhbXMpIHtcclxuICAgICAgICBpZiAoc3RyZWFtcyAmJiAhKHN0cmVhbXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICAgICAgc3RyZWFtcyA9IFtzdHJlYW1zXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc2V0VmlkZW9TdHJlYW1zKHN0cmVhbXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiByZXNldFZpZGVvU3RyZWFtcyhzdHJlYW1zKSB7XHJcbiAgICAgICAgdmlkZW9zID0gW107XHJcbiAgICAgICAgc3RyZWFtcyA9IHN0cmVhbXMgfHwgYXJyYXlPZk1lZGlhU3RyZWFtcztcclxuXHJcbiAgICAgICAgLy8gdmlhOiBAYWRyaWFuLWJlclxyXG4gICAgICAgIHN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcclxuICAgICAgICAgICAgaWYgKCFzdHJlYW0uZ2V0VHJhY2tzKCkuZmlsdGVyKGZ1bmN0aW9uKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdC5raW5kID09PSAndmlkZW8nO1xyXG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB2aWRlbyA9IGdldFZpZGVvKHN0cmVhbSk7XHJcbiAgICAgICAgICAgIHZpZGVvLnN0cmVhbSA9IHN0cmVhbTtcclxuICAgICAgICAgICAgdmlkZW9zLnB1c2godmlkZW8pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZvciBkZWJ1Z2dpbmdcclxuICAgIHRoaXMubmFtZSA9ICdNdWx0aVN0cmVhbXNNaXhlcic7XHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRNaXhlZFN0cmVhbSA9IGdldE1peGVkU3RyZWFtO1xyXG5cclxufVxyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgLyogJiYgISFtb2R1bGUuZXhwb3J0cyovICkge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gTXVsdGlTdHJlYW1zTWl4ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZSgnTXVsdGlTdHJlYW1zTWl4ZXInLCBbXSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNdWx0aVN0cmVhbXNNaXhlcjtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxuXHJcbi8vIF9fX19fX19fX19fX19fX19fX19fX19cclxuLy8gTXVsdGlTdHJlYW1SZWNvcmRlci5qc1xyXG5cclxuLypcclxuICogVmlkZW8gY29uZmVyZW5jZSByZWNvcmRpbmcsIHVzaW5nIGNhcHR1cmVTdHJlYW0gQVBJIGFsb25nIHdpdGggV2ViQXVkaW8gYW5kIENhbnZhczJEIEFQSS5cclxuICovXHJcblxyXG4vKipcclxuICogTXVsdGlTdHJlYW1SZWNvcmRlciBjYW4gcmVjb3JkIG11bHRpcGxlIHZpZGVvcyBpbiBzaW5nbGUgY29udGFpbmVyLlxyXG4gKiBAc3VtbWFyeSBNdWx0aS12aWRlb3MgcmVjb3JkZXIuXHJcbiAqIEBsaWNlbnNlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQy9ibG9iL21hc3Rlci9MSUNFTlNFfE1JVH1cclxuICogQGF1dGhvciB7QGxpbmsgaHR0cHM6Ly9NdWF6S2hhbi5jb218TXVheiBLaGFufVxyXG4gKiBAdHlwZWRlZiBNdWx0aVN0cmVhbVJlY29yZGVyXHJcbiAqIEBjbGFzc1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgb3B0aW9ucyA9IHtcclxuICogICAgIG1pbWVUeXBlOiAndmlkZW8vd2VibSdcclxuICogfVxyXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgTXVsdGlTdHJlYW1SZWNvcmRlcihBcnJheU9mTWVkaWFTdHJlYW1zLCBvcHRpb25zKTtcclxuICogcmVjb3JkZXIucmVjb3JkKCk7XHJcbiAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICpcclxuICogICAgIC8vIG9yXHJcbiAqICAgICB2YXIgYmxvYiA9IHJlY29yZGVyLmJsb2I7XHJcbiAqIH0pO1xyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1JlY29yZFJUQ3xSZWNvcmRSVEMgU291cmNlIENvZGV9XHJcbiAqIEBwYXJhbSB7TWVkaWFTdHJlYW1zfSBtZWRpYVN0cmVhbXMgLSBBcnJheSBvZiBNZWRpYVN0cmVhbXMuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgLSB7ZGlzYWJsZUxvZ3M6dHJ1ZSwgZnJhbWVJbnRlcnZhbDogMSwgbWltZVR5cGU6IFwidmlkZW8vd2VibVwifVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIE11bHRpU3RyZWFtUmVjb3JkZXIoYXJyYXlPZk1lZGlhU3RyZWFtcywgb3B0aW9ucykge1xyXG4gICAgYXJyYXlPZk1lZGlhU3RyZWFtcyA9IGFycmF5T2ZNZWRpYVN0cmVhbXMgfHwgW107XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIG1peGVyO1xyXG4gICAgdmFyIG1lZGlhUmVjb3JkZXI7XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge1xyXG4gICAgICAgIGVsZW1lbnRDbGFzczogJ211bHRpLXN0cmVhbXMtbWl4ZXInLFxyXG4gICAgICAgIG1pbWVUeXBlOiAndmlkZW8vd2VibScsXHJcbiAgICAgICAgdmlkZW86IHtcclxuICAgICAgICAgICAgd2lkdGg6IDM2MCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAyNDBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghb3B0aW9ucy5mcmFtZUludGVydmFsKSB7XHJcbiAgICAgICAgb3B0aW9ucy5mcmFtZUludGVydmFsID0gMTA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLnZpZGVvKSB7XHJcbiAgICAgICAgb3B0aW9ucy52aWRlbyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghb3B0aW9ucy52aWRlby53aWR0aCkge1xyXG4gICAgICAgIG9wdGlvbnMudmlkZW8ud2lkdGggPSAzNjA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLnZpZGVvLmhlaWdodCkge1xyXG4gICAgICAgIG9wdGlvbnMudmlkZW8uaGVpZ2h0ID0gMjQwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBhbGwgTWVkaWFTdHJlYW1zLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE11bHRpU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5yZWNvcmQoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5yZWNvcmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBnaXRodWIvbXVhei1raGFuL011bHRpU3RyZWFtc01peGVyXHJcbiAgICAgICAgbWl4ZXIgPSBuZXcgTXVsdGlTdHJlYW1zTWl4ZXIoYXJyYXlPZk1lZGlhU3RyZWFtcywgb3B0aW9ucy5lbGVtZW50Q2xhc3MgfHwgJ211bHRpLXN0cmVhbXMtbWl4ZXInKTtcclxuXHJcbiAgICAgICAgaWYgKGdldEFsbFZpZGVvVHJhY2tzKCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG1peGVyLmZyYW1lSW50ZXJ2YWwgPSBvcHRpb25zLmZyYW1lSW50ZXJ2YWwgfHwgMTA7XHJcbiAgICAgICAgICAgIG1peGVyLndpZHRoID0gb3B0aW9ucy52aWRlby53aWR0aCB8fCAzNjA7XHJcbiAgICAgICAgICAgIG1peGVyLmhlaWdodCA9IG9wdGlvbnMudmlkZW8uaGVpZ2h0IHx8IDI0MDtcclxuICAgICAgICAgICAgbWl4ZXIuc3RhcnREcmF3aW5nRnJhbWVzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy5wcmV2aWV3U3RyZWFtICYmIHR5cGVvZiBvcHRpb25zLnByZXZpZXdTdHJlYW0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5wcmV2aWV3U3RyZWFtKG1peGVyLmdldE1peGVkU3RyZWFtKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcmVjb3JkIHVzaW5nIE1lZGlhUmVjb3JkZXIgQVBJXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlciA9IG5ldyBNZWRpYVN0cmVhbVJlY29yZGVyKG1peGVyLmdldE1peGVkU3RyZWFtKCksIG9wdGlvbnMpO1xyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIucmVjb3JkKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGdldEFsbFZpZGVvVHJhY2tzKCkge1xyXG4gICAgICAgIHZhciB0cmFja3MgPSBbXTtcclxuICAgICAgICBhcnJheU9mTWVkaWFTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XHJcbiAgICAgICAgICAgIGdldFRyYWNrcyhzdHJlYW0sICd2aWRlbycpLmZvckVhY2goZnVuY3Rpb24odHJhY2spIHtcclxuICAgICAgICAgICAgICAgIHRyYWNrcy5wdXNoKHRyYWNrKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRyYWNrcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHN0b3BzIHJlY29yZGluZyBNZWRpYVN0cmVhbS5cclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24sIHRoYXQgaXMgdXNlZCB0byBwYXNzIHJlY29yZGVkIGJsb2IgYmFjayB0byB0aGUgY2FsbGVlLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE11bHRpU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcclxuICAgICAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICogfSk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XHJcbiAgICAgICAgICAgIHNlbGYuYmxvYiA9IGJsb2I7XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFjayhibG9iKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuY2xlYXJSZWNvcmRlZERhdGEoKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE11bHRpU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5wYXVzZSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5wYXVzZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCByZXN1bWVzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBNdWx0aVN0cmVhbVJlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIucmVzdW1lKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzZXRzIGN1cnJlbnRseSByZWNvcmRlZCBkYXRhLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE11bHRpU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5jbGVhclJlY29yZGVkRGF0YSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmNsZWFyUmVjb3JkZWREYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIpIHtcclxuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5jbGVhclJlY29yZGVkRGF0YSgpO1xyXG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtaXhlcikge1xyXG4gICAgICAgICAgICBtaXhlci5yZWxlYXNlU3RyZWFtcygpO1xyXG4gICAgICAgICAgICBtaXhlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBleHRyYSBtZWRpYS1zdHJlYW1zIHRvIGV4aXN0aW5nIHJlY29yZGluZ3MuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgTXVsdGlTdHJlYW1SZWNvcmRlclxyXG4gICAgICogQHBhcmFtIHtNZWRpYVN0cmVhbXN9IG1lZGlhU3RyZWFtcyAtIEFycmF5IG9mIE1lZGlhU3RyZWFtc1xyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLmFkZFN0cmVhbXMoW25ld0F1ZGlvU3RyZWFtLCBuZXdWaWRlb1N0cmVhbV0pO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmFkZFN0cmVhbXMgPSBmdW5jdGlvbihzdHJlYW1zKSB7XHJcbiAgICAgICAgaWYgKCFzdHJlYW1zKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdGaXJzdCBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghKHN0cmVhbXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICAgICAgc3RyZWFtcyA9IFtzdHJlYW1zXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFycmF5T2ZNZWRpYVN0cmVhbXMuY29uY2F0KHN0cmVhbXMpO1xyXG5cclxuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIgfHwgIW1peGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1peGVyLmFwcGVuZFN0cmVhbXMoc3RyZWFtcyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnByZXZpZXdTdHJlYW0gJiYgdHlwZW9mIG9wdGlvbnMucHJldmlld1N0cmVhbSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBvcHRpb25zLnByZXZpZXdTdHJlYW0obWl4ZXIuZ2V0TWl4ZWRTdHJlYW0oKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc2V0IHZpZGVvcyBkdXJpbmcgbGl2ZSByZWNvcmRpbmcuIFJlcGxhY2Ugb2xkIHZpZGVvcyBlLmcuIHJlcGxhY2UgY2FtZXJhcyB3aXRoIGZ1bGwtc2NyZWVuLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE11bHRpU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBwYXJhbSB7TWVkaWFTdHJlYW1zfSBtZWRpYVN0cmVhbXMgLSBBcnJheSBvZiBNZWRpYVN0cmVhbXNcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5yZXNldFZpZGVvU3RyZWFtcyhbbmV3VmlkZW8xLCBuZXdWaWRlbzJdKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXNldFZpZGVvU3RyZWFtcyA9IGZ1bmN0aW9uKHN0cmVhbXMpIHtcclxuICAgICAgICBpZiAoIW1peGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdHJlYW1zICYmICEoc3RyZWFtcyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgICAgICBzdHJlYW1zID0gW3N0cmVhbXNdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWl4ZXIucmVzZXRWaWRlb1N0cmVhbXMoc3RyZWFtcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBNdWx0aVN0cmVhbXNNaXhlclxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIE11bHRpU3RyZWFtUmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBsZXQgbWl4ZXIgPSByZWNvcmRlci5nZXRNaXhlcigpO1xyXG4gICAgICogbWl4ZXIuYXBwZW5kU3RyZWFtcyhbbmV3U3RyZWFtXSk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ2V0TWl4ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbWl4ZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGZvciBkZWJ1Z2dpbmdcclxuICAgIHRoaXMubmFtZSA9ICdNdWx0aVN0cmVhbVJlY29yZGVyJztcclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBSZWNvcmRSVEMuTXVsdGlTdHJlYW1SZWNvcmRlciA9IE11bHRpU3RyZWFtUmVjb3JkZXI7XHJcbn1cblxyXG4vLyBfX19fX19fX19fX19fX19fX19fX19cclxuLy8gUmVjb3JkUlRDLnByb21pc2VzLmpzXHJcblxyXG4vKipcclxuICogUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyIGFkZHMgcHJvbWlzZXMgc3VwcG9ydCBpbiB7QGxpbmsgUmVjb3JkUlRDfS4gVHJ5IGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL3NpbXBsZS1kZW1vcy9SZWNvcmRSVENQcm9taXNlc0hhbmRsZXIuaHRtbHxkZW1vIGhlcmV9XHJcbiAqIEBzdW1tYXJ5IFByb21pc2VzIGZvciB7QGxpbmsgUmVjb3JkUlRDfVxyXG4gKiBAbGljZW5zZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEMvYmxvYi9tYXN0ZXIvTElDRU5TRXxNSVR9XHJcbiAqIEBhdXRob3Ige0BsaW5rIGh0dHBzOi8vTXVhektoYW4uY29tfE11YXogS2hhbn1cclxuICogQHR5cGVkZWYgUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyXHJcbiAqIEBjbGFzc1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyKG1lZGlhU3RyZWFtLCBvcHRpb25zKTtcclxuICogcmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKVxyXG4gKiAgICAgICAgIC50aGVuKHN1Y2Nlc3NDQilcclxuICogICAgICAgICAuY2F0Y2goZXJyb3JDQik7XHJcbiAqIC8vIE5vdGU6IFlvdSBjYW4gYWNjZXNzIGFsbCBSZWNvcmRSVEMgQVBJIHVzaW5nIFwicmVjb3JkZXIucmVjb3JkUlRDXCIgZS5nLiBcclxuICogcmVjb3JkZXIucmVjb3JkUlRDLm9uU3RhdGVDaGFuZ2VkID0gZnVuY3Rpb24oc3RhdGUpIHt9O1xyXG4gKiByZWNvcmRlci5yZWNvcmRSVEMuc2V0UmVjb3JkaW5nRHVyYXRpb24oNTAwMCk7XHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBTaW5nbGUgbWVkaWEtc3RyZWFtIG9iamVjdCwgYXJyYXkgb2YgbWVkaWEtc3RyZWFtcywgaHRtbC1jYW52YXMtZWxlbWVudCwgZXRjLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIC0ge3R5cGU6XCJ2aWRlb1wiLCByZWNvcmRlclR5cGU6IE1lZGlhU3RyZWFtUmVjb3JkZXIsIGRpc2FibGVMb2dzOiB0cnVlLCBudW1iZXJPZkF1ZGlvQ2hhbm5lbHM6IDEsIGJ1ZmZlclNpemU6IDAsIHNhbXBsZVJhdGU6IDAsIHZpZGVvOiBIVE1MVmlkZW9FbGVtZW50LCBldGMufVxyXG4gKiBAdGhyb3dzIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgXCJuZXdcIiBrZXl3b3JkIGlzIG5vdCB1c2VkIHRvIGluaXRpYXRlIFwiUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyXCIuIEFsc28gdGhyb3dzIGVycm9yIGlmIGZpcnN0IGFyZ3VtZW50IFwiTWVkaWFTdHJlYW1cIiBpcyBtaXNzaW5nLlxyXG4gKiBAcmVxdWlyZXMge0BsaW5rIFJlY29yZFJUQ31cclxuICovXHJcblxyXG5mdW5jdGlvbiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXIobWVkaWFTdHJlYW0sIG9wdGlvbnMpIHtcclxuICAgIGlmICghdGhpcykge1xyXG4gICAgICAgIHRocm93ICdVc2UgXCJuZXcgUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyKClcIic7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBtZWRpYVN0cmVhbSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICB0aHJvdyAnRmlyc3QgYXJndW1lbnQgXCJNZWRpYVN0cmVhbVwiIGlzIHJlcXVpcmVkLic7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHByb3BlcnR5IHtCbG9ifSBibG9iIC0gQWNjZXNzL3JlYWNoIHRoZSBuYXRpdmUge0BsaW5rIFJlY29yZFJUQ30gb2JqZWN0LlxyXG4gICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1Byb21pc2VzSGFuZGxlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGxldCBpbnRlcm5hbCA9IHJlY29yZGVyLnJlY29yZFJUQy5nZXRJbnRlcm5hbFJlY29yZGVyKCk7XHJcbiAgICAgKiBhbGVydChpbnRlcm5hbCBpbnN0YW5jZW9mIE1lZGlhU3RyZWFtUmVjb3JkZXIpO1xyXG4gICAgICogcmVjb3JkZXIucmVjb3JkUlRDLm9uU3RhdGVDaGFuZ2VkID0gZnVuY3Rpb24oc3RhdGUpIHt9O1xyXG4gICAgICovXHJcbiAgICBzZWxmLnJlY29yZFJUQyA9IG5ldyBSZWNvcmRSVEMobWVkaWFTdHJlYW0sIG9wdGlvbnMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBNZWRpYVN0cmVhbS5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdGFydFJlY29yZGluZygpXHJcbiAgICAgKiAgICAgICAgIC50aGVuKHN1Y2Nlc3NDQilcclxuICAgICAqICAgICAgICAgLmNhdGNoKGVycm9yQ0IpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnN0YXJ0UmVjb3JkaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5yZWNvcmRSVEMuc3RhcnRSZWNvcmRpbmcoKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgdGhlIHJlY29yZGluZy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKCkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAqICAgICB2YXIgYmxvYiA9IHJlY29yZGVyLmdldEJsb2IoKTtcclxuICAgICAqIH0pLmNhdGNoKGVycm9yQ0IpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnN0b3BSZWNvcmRpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlY29yZFJUQy5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKHVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYmxvYiA9IHNlbGYucmVjb3JkUlRDLmdldEJsb2IoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxmLmJsb2IgfHwgIXNlbGYuYmxvYi5zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgnRW1wdHkgYmxvYi4nLCBzZWxmLmJsb2IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVybCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcGF1c2VzIHRoZSByZWNvcmRpbmcuIFlvdSBjYW4gcmVzdW1lIHJlY29yZGluZyB1c2luZyBcInJlc3VtZVJlY29yZGluZ1wiIG1ldGhvZC5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5wYXVzZVJlY29yZGluZygpXHJcbiAgICAgKiAgICAgICAgIC50aGVuKHN1Y2Nlc3NDQilcclxuICAgICAqICAgICAgICAgLmNhdGNoKGVycm9yQ0IpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnBhdXNlUmVjb3JkaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5yZWNvcmRSVEMucGF1c2VSZWNvcmRpbmcoKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1Byb21pc2VzSGFuZGxlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnJlc3VtZVJlY29yZGluZygpXHJcbiAgICAgKiAgICAgICAgIC50aGVuKHN1Y2Nlc3NDQilcclxuICAgICAqICAgICAgICAgLmNhdGNoKGVycm9yQ0IpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc3VtZVJlY29yZGluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHNlbGYucmVjb3JkUlRDLnJlc3VtZVJlY29yZGluZygpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCByZXR1cm5zIGRhdGEtdXJsIGZvciB0aGUgcmVjb3JkZWQgYmxvYi5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKCkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAqICAgICByZWNvcmRlci5nZXREYXRhVVJMKCkudGhlbihmdW5jdGlvbihkYXRhVVJMKSB7XHJcbiAgICAgKiAgICAgICAgIHdpbmRvdy5vcGVuKGRhdGFVUkwpO1xyXG4gICAgICogICAgIH0pLmNhdGNoKGVycm9yQ0IpOztcclxuICAgICAqIH0pLmNhdGNoKGVycm9yQ0IpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmdldERhdGFVUkwgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHNlbGYucmVjb3JkUlRDLmdldERhdGFVUkwoZnVuY3Rpb24oZGF0YVVSTCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVSTCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgcmVjb3JkZWQgYmxvYi5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5zdG9wUmVjb3JkaW5nKCkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAqICAgICByZWNvcmRlci5nZXRCbG9iKCkudGhlbihmdW5jdGlvbihibG9iKSB7fSlcclxuICAgICAqIH0pLmNhdGNoKGVycm9yQ0IpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmdldEJsb2IgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHNlbGYucmVjb3JkUlRDLmdldEJsb2IoKSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGludGVybmFsIHJlY29yZGluZyBvYmplY3QuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogbGV0IGludGVybmFsUmVjb3JkZXIgPSBhd2FpdCByZWNvcmRlci5nZXRJbnRlcm5hbFJlY29yZGVyKCk7XHJcbiAgICAgKiBpZihpbnRlcm5hbFJlY29yZGVyIGluc3RhbmNlb2YgTXVsdGlTdHJlYW1SZWNvcmRlcikge1xyXG4gICAgICogICAgIGludGVybmFsUmVjb3JkZXIuYWRkU3RyZWFtcyhbbmV3QXVkaW9TdHJlYW1dKTtcclxuICAgICAqICAgICBpbnRlcm5hbFJlY29yZGVyLnJlc2V0VmlkZW9TdHJlYW1zKFtzY3JlZW5TdHJlYW1dKTtcclxuICAgICAqIH1cclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFxyXG4gICAgICovXHJcbiAgICB0aGlzLmdldEludGVybmFsUmVjb3JkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHNlbGYucmVjb3JkUlRDLmdldEludGVybmFsUmVjb3JkZXIoKSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIHJlc2V0cyB0aGUgcmVjb3JkZXIuIFNvIHRoYXQgeW91IGNhbiByZXVzZSBzaW5nbGUgcmVjb3JkZXIgaW5zdGFuY2UgbWFueSB0aW1lcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBhd2FpdCByZWNvcmRlci5yZXNldCgpO1xyXG4gICAgICogcmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKTsgLy8gcmVjb3JkIGFnYWluXHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHNlbGYucmVjb3JkUlRDLnJlc2V0KCkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXN0cm95IFJlY29yZFJUQyBpbnN0YW5jZS4gQ2xlYXIgYWxsIHJlY29yZGVycyBhbmQgb2JqZWN0cy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5kZXN0cm95KCkudGhlbihzdWNjZXNzQ0IpLmNhdGNoKGVycm9yQ0IpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHNlbGYucmVjb3JkUlRDLmRlc3Ryb3koKSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCByZWNvcmRlcidzIHJlYWRvbmx5IHN0YXRlLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1Byb21pc2VzSGFuZGxlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGxldCBzdGF0ZSA9IGF3YWl0IHJlY29yZGVyLmdldFN0YXRlKCk7XHJcbiAgICAgKiAvLyBvclxyXG4gICAgICogcmVjb3JkZXIuZ2V0U3RhdGUoKS50aGVuKHN0YXRlID0+IHsgY29uc29sZS5sb2coc3RhdGUpOyB9KVxyXG4gICAgICogQHJldHVybnMge1N0cmluZ30gUmV0dXJucyByZWNvcmRpbmcgc3RhdGUuXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHNlbGYucmVjb3JkUlRDLmdldFN0YXRlKCkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHJvcGVydHkge0Jsb2J9IGJsb2IgLSBSZWNvcmRlZCBkYXRhIGFzIFwiQmxvYlwiIG9iamVjdC5cclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBhd2FpdCByZWNvcmRlci5zdG9wUmVjb3JkaW5nKCk7XHJcbiAgICAgKiBsZXQgYmxvYiA9IHJlY29yZGVyLmdldEJsb2IoKTsgLy8gb3IgXCJyZWNvcmRlci5yZWNvcmRSVEMuYmxvYlwiXHJcbiAgICAgKiBpbnZva2VTYXZlQXNEaWFsb2coYmxvYik7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuYmxvYiA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWNvcmRSVEMgdmVyc2lvbiBudW1iZXJcclxuICAgICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSB2ZXJzaW9uIC0gUmVsZWFzZSB2ZXJzaW9uIG51bWJlci5cclxuICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXJcclxuICAgICAqIEBzdGF0aWNcclxuICAgICAqIEByZWFkb25seVxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGFsZXJ0KHJlY29yZGVyLnZlcnNpb24pO1xyXG4gICAgICovXHJcbiAgICB0aGlzLnZlcnNpb24gPSAnNS42LjInO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIFJlY29yZFJUQyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIFJlY29yZFJUQy5SZWNvcmRSVENQcm9taXNlc0hhbmRsZXIgPSBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXI7XHJcbn1cblxyXG4vLyBfX19fX19fX19fX19fX19fX19fX19fXHJcbi8vIFdlYkFzc2VtYmx5UmVjb3JkZXIuanNcclxuXHJcbi8qKlxyXG4gKiBXZWJBc3NlbWJseVJlY29yZGVyIGxldHMgeW91IGNyZWF0ZSB3ZWJtIHZpZGVvcyBpbiBKYXZhU2NyaXB0IHZpYSBXZWJBc3NlbWJseS4gVGhlIGxpYnJhcnkgY29uc3VtZXMgcmF3IFJHQkEzMiBidWZmZXJzICg0IGJ5dGVzIHBlciBwaXhlbCkgYW5kIHR1cm5zIHRoZW0gaW50byBhIHdlYm0gdmlkZW8gd2l0aCB0aGUgZ2l2ZW4gZnJhbWVyYXRlIGFuZCBxdWFsaXR5LiBUaGlzIG1ha2VzIGl0IGNvbXBhdGlibGUgb3V0LW9mLXRoZS1ib3ggd2l0aCBJbWFnZURhdGEgZnJvbSBhIENBTlZBUy4gV2l0aCByZWFsdGltZSBtb2RlIHlvdSBjYW4gYWxzbyB1c2Ugd2VibS13YXNtIGZvciBzdHJlYW1pbmcgd2VibSB2aWRlb3MuXHJcbiAqIEBzdW1tYXJ5IFZpZGVvIHJlY29yZGluZyBmZWF0dXJlIGluIENocm9tZSwgRmlyZWZveCBhbmQgbWF5YmUgRWRnZS5cclxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL2Jsb2IvbWFzdGVyL0xJQ0VOU0V8TUlUfVxyXG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL011YXpLaGFuLmNvbXxNdWF6IEtoYW59XHJcbiAqIEB0eXBlZGVmIFdlYkFzc2VtYmx5UmVjb3JkZXJcclxuICogQGNsYXNzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciByZWNvcmRlciA9IG5ldyBXZWJBc3NlbWJseVJlY29yZGVyKG1lZGlhU3RyZWFtKTtcclxuICogcmVjb3JkZXIucmVjb3JkKCk7XHJcbiAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICogfSk7XHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDfFJlY29yZFJUQyBTb3VyY2UgQ29kZX1cclxuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBNZWRpYVN0cmVhbSBvYmplY3QgZmV0Y2hlZCB1c2luZyBnZXRVc2VyTWVkaWEgQVBJIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgLSB7d2ViQXNzZW1ibHlQYXRoOid3ZWJtLXdhc20ud2FzbScsd29ya2VyUGF0aDogJ3dlYm0td29ya2VyLmpzJywgZnJhbWVSYXRlOiAzMCwgd2lkdGg6IDE5MjAsIGhlaWdodDogMTA4MCwgYml0cmF0ZTogMTAyNCwgcmVhbHRpbWU6IHRydWV9XHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJBc3NlbWJseVJlY29yZGVyKHN0cmVhbSwgY29uZmlnKSB7XHJcbiAgICAvLyBiYXNlZCBvbjogZ2l0aHViLmNvbS9Hb29nbGVDaHJvbWVMYWJzL3dlYm0td2FzbVxyXG5cclxuICAgIGlmICh0eXBlb2YgUmVhZGFibGVTdHJlYW0gPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBXcml0YWJsZVN0cmVhbSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvLyBiZWNhdXNlIGl0IGZpeGVzIHJlYWRhYmxlL3dyaXRhYmxlIHN0cmVhbXMgaXNzdWVzXHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRm9sbG93aW5nIHBvbHlmaWxsIGlzIHN0cm9uZ2x5IHJlY29tbWVuZGVkOiBodHRwczovL3VucGtnLmNvbS9AbWF0dGlhc2J1ZWxlbnMvd2ViLXN0cmVhbXMtcG9seWZpbGwvZGlzdC9wb2x5ZmlsbC5taW4uanMnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XHJcblxyXG4gICAgY29uZmlnLndpZHRoID0gY29uZmlnLndpZHRoIHx8IDY0MDtcclxuICAgIGNvbmZpZy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IHx8IDQ4MDtcclxuICAgIGNvbmZpZy5mcmFtZVJhdGUgPSBjb25maWcuZnJhbWVSYXRlIHx8IDMwO1xyXG4gICAgY29uZmlnLmJpdHJhdGUgPSBjb25maWcuYml0cmF0ZSB8fCAxMjAwO1xyXG4gICAgY29uZmlnLnJlYWx0aW1lID0gY29uZmlnLnJlYWx0aW1lIHx8IHRydWU7XHJcblxyXG4gICAgZnVuY3Rpb24gY3JlYXRlQnVmZmVyVVJMKGJ1ZmZlciwgdHlwZSkge1xyXG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtidWZmZXJdLCB7XHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGUgfHwgJydcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGZpbmlzaGVkO1xyXG5cclxuICAgIGZ1bmN0aW9uIGNhbWVyYVN0cmVhbSgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlYWRhYmxlU3RyZWFtKHtcclxuICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKGNvbnRyb2xsZXIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICAgICAgICAgIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdmlkZW8uc3JjT2JqZWN0ID0gc3RyZWFtO1xyXG4gICAgICAgICAgICAgICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdmlkZW8uaGVpZ2h0ID0gY29uZmlnLmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZpZGVvLndpZHRoID0gY29uZmlnLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgdmlkZW8udm9sdW1lID0gMDtcclxuICAgICAgICAgICAgICAgIHZpZGVvLm9ucGxheWluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN2cy53aWR0aCA9IGNvbmZpZy53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjdnMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gY3ZzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZyYW1lVGltZW91dCA9IDEwMDAgLyBjb25maWcuZnJhbWVSYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW1lcmFUaW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uIGYoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5pc2hlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChjYW1lcmFUaW1lcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25maWcub25WaWRlb1Byb2Nlc3NTdGFydGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLm9uVmlkZW9Qcm9jZXNzU3RhcnRlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKHZpZGVvLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRyb2xsZXIuX2NvbnRyb2xsZWRSZWFkYWJsZVN0cmVhbS5zdGF0ZSAhPT0gJ2Nsb3NlZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGNvbmZpZy53aWR0aCwgY29uZmlnLmhlaWdodClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGZyYW1lVGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdmlkZW8ucGxheSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHdvcmtlcjtcclxuXHJcbiAgICBmdW5jdGlvbiBzdGFydFJlY29yZGluZyhzdHJlYW0sIGJ1ZmZlcikge1xyXG4gICAgICAgIGlmICghY29uZmlnLndvcmtlclBhdGggJiYgIWJ1ZmZlcikge1xyXG4gICAgICAgICAgICBmaW5pc2hlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgLy8gaXMgaXQgc2FmZSB0byB1c2UgQGxhdGVzdCA/XHJcblxyXG4gICAgICAgICAgICBmZXRjaChcclxuICAgICAgICAgICAgICAgICdodHRwczovL3VucGtnLmNvbS93ZWJtLXdhc21AbGF0ZXN0L2Rpc3Qvd2VibS13b3JrZXIuanMnXHJcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbihyKSB7XHJcbiAgICAgICAgICAgICAgICByLmFycmF5QnVmZmVyKCkudGhlbihmdW5jdGlvbihidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydFJlY29yZGluZyhzdHJlYW0sIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY29uZmlnLndvcmtlclBhdGggJiYgYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbYnVmZmVyXSwge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQvamF2YXNjcmlwdCdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbmZpZy53b3JrZXJQYXRoID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY29uZmlnLndvcmtlclBhdGgpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignd29ya2VyUGF0aCBwYXJhbWV0ZXIgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdvcmtlciA9IG5ldyBXb3JrZXIoY29uZmlnLndvcmtlclBhdGgpO1xyXG5cclxuICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoY29uZmlnLndlYkFzc2VtYmx5UGF0aCB8fCAnaHR0cHM6Ly91bnBrZy5jb20vd2VibS13YXNtQGxhdGVzdC9kaXN0L3dlYm0td2FzbS53YXNtJyk7XHJcbiAgICAgICAgd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gJ1JFQURZJykge1xyXG4gICAgICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogY29uZmlnLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogY29uZmlnLmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICBiaXRyYXRlOiBjb25maWcuYml0cmF0ZSB8fCAxMjAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbWViYXNlRGVuOiBjb25maWcuZnJhbWVSYXRlIHx8IDMwLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlYWx0aW1lOiBjb25maWcucmVhbHRpbWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhbWVyYVN0cmVhbSgpLnBpcGVUbyhuZXcgV3JpdGFibGVTdHJlYW0oe1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihpbWFnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmluaXNoZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dvdCBpbWFnZSwgYnV0IHJlY29yZGVyIGlzIGZpbmlzaGVkIScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoaW1hZ2UuZGF0YS5idWZmZXIsIFtpbWFnZS5kYXRhLmJ1ZmZlcl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghIWV2ZW50LmRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmICghaXNQYXVzZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcnJheU9mQnVmZmVycy5wdXNoKGV2ZW50LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCByZWNvcmRzIHZpZGVvLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFdlYkFzc2VtYmx5UmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5yZWNvcmQoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5yZWNvcmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBhcnJheU9mQnVmZmVycyA9IFtdO1xyXG4gICAgICAgIGlzUGF1c2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5ibG9iID0gbnVsbDtcclxuICAgICAgICBzdGFydFJlY29yZGluZyhzdHJlYW0pO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5pbml0Q2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgY29uZmlnLmluaXRDYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGlzUGF1c2VkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcGF1c2VzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBXZWJBc3NlbWJseVJlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIucGF1c2UoKTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCByZXN1bWVzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cclxuICAgICAqIEBtZXRob2RcclxuICAgICAqIEBtZW1iZXJvZiBXZWJBc3NlbWJseVJlY29yZGVyXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogcmVjb3JkZXIucmVzdW1lKCk7XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaXNQYXVzZWQgPSBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gdGVybWluYXRlKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCF3b3JrZXIpIHtcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBXYWl0IGZvciBudWxsIGV2ZW50IGRhdGEgdG8gaW5kaWNhdGUgdGhhdCB0aGUgZW5jb2RpbmcgaXMgY29tcGxldGVcclxuICAgICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB3b3JrZXIudGVybWluYXRlKCk7XHJcbiAgICAgICAgICAgICAgICB3b3JrZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhcnJheU9mQnVmZmVycyA9IFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgcmVjb3JkaW5nIHZpZGVvLlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXHJcbiAgICAgKiBAbWV0aG9kXHJcbiAgICAgKiBAbWVtYmVyb2YgV2ViQXNzZW1ibHlSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xyXG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICBmaW5pc2hlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciByZWNvcmRlciA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRlcm1pbmF0ZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmVjb3JkZXIuYmxvYiA9IG5ldyBCbG9iKGFycmF5T2ZCdWZmZXJzLCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndmlkZW8vd2VibSdcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFjayhyZWNvcmRlci5ibG9iKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gZm9yIGRlYnVnZ2luZ1xyXG4gICAgdGhpcy5uYW1lID0gJ1dlYkFzc2VtYmx5UmVjb3JkZXInO1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmVzZXRzIGN1cnJlbnRseSByZWNvcmRlZCBkYXRhLlxyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG1lbWJlcm9mIFdlYkFzc2VtYmx5UmVjb3JkZXJcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiByZWNvcmRlci5jbGVhclJlY29yZGVkRGF0YSgpO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmNsZWFyUmVjb3JkZWREYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgYXJyYXlPZkJ1ZmZlcnMgPSBbXTtcclxuICAgICAgICBpc1BhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuYmxvYiA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHRvZG86IGlmIHJlY29yZGluZy1PTiB0aGVuIFNUT1AgaXQgZmlyc3RcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHJvcGVydHkge0Jsb2J9IGJsb2IgLSBUaGUgcmVjb3JkZWQgYmxvYiBvYmplY3QuXHJcbiAgICAgKiBAbWVtYmVyb2YgV2ViQXNzZW1ibHlSZWNvcmRlclxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKXtcclxuICAgICAqICAgICB2YXIgYmxvYiA9IHJlY29yZGVyLmJsb2I7XHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgdGhpcy5ibG9iID0gbnVsbDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBSZWNvcmRSVEMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBSZWNvcmRSVEMuV2ViQXNzZW1ibHlSZWNvcmRlciA9IFdlYkFzc2VtYmx5UmVjb3JkZXI7XHJcbn1cbiIsImltcG9ydCB7IENPTlRFTlRfU0NSSVBUX01BVENIRVMgfSBmcm9tIFwiQC91dGlscy9NYXRjaGVzXCI7XG5pbXBvcnQgeyBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXIgfSBmcm9tICdyZWNvcmRydGMnO1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29udGVudFNjcmlwdCh7XG4gIG1hdGNoZXM6IFtDT05URU5UX1NDUklQVF9NQVRDSEVTXSxcbiAgYXN5bmMgbWFpbihjdHgpIHtcbiAgICBsZXQgc2NyZWVuU3RyZWFtOiBNZWRpYVN0cmVhbSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBpc1JlY29yZGluZyA9IGZhbHNlO1xuICAgIGxldCBpc1JlY29yZGluZ1N0b3BwZWQgPSB0cnVlO1xuICAgIGNvbnNvbGUubG9nKFwiSGVsbG8gZnJvbSBjb250ZW50IHNjcmlwdFwiKVxuICAgIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICAgIGlmIChtZXNzYWdlLmFjdGlvbiA9PT0gXCJzdGFydFJlY29yZGluZ1wiKSB7XG4gICAgICAgIGlzUmVjb3JkaW5nU3RvcHBlZD1mYWxzZTtcbiAgICAgICAgc3RhcnRTY3JlZW5SZWNvcmRpbmcoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSBcInN0b3BSZWNvcmRpbmdcIikge1xuICAgICAgICBzdG9wU2NyZWVuUmVjb3JkaW5nKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhc3luYyBmdW5jdGlvbiBzdG9wU2NyZWVuUmVjb3JkaW5nKCkge1xuICAgICAgaWYgKHNjcmVlblN0cmVhbSkge1xuICAgICAgICBzY3JlZW5TdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCgodHJhY2spID0+IHtcbiAgICAgICAgICB0cmFjay5zdG9wKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzY3JlZW5TdHJlYW0gPSBudWxsO1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfm5EgU2NyZWVuIHN0cmVhbSBzdG9wcGVkLlwiKTsgXG4gICAgICB9XG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwicmVjb3JkaW5nU3RvcHBlZFwiLCBvcHRpb25zOiB7XG4gICAgICAgICAgZGF0YTpcInJlY29yZGluZ1N0b3BwZWRcIlxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHN0b3JhZ2Uuc2V0SXRlbShcImxvY2FsOmlzUmVjb3JkaW5nXCIsIFwiZmFsc2VcIik7XG4gICAgICBpc1JlY29yZGluZ1N0b3BwZWQ9dHJ1ZTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiBnZXRTY3JlZW5TdHJlYW0oKSB7XG4gICAgICBpZiAoIXNjcmVlblN0cmVhbSkge1xuICAgICAgICBzY3JlZW5TdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldERpc3BsYXlNZWRpYSh7XG4gICAgICAgICAgdmlkZW86IHRydWUsXG4gICAgICAgICAgYXVkaW86IHRydWUsXG4gICAgICAgICAgc2VsZkJyb3dzZXJTdXJmYWNlOiBcImluY2x1ZGVcIlxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfjqUgU2NyZWVuIHN0cmVhbSBpbml0aWFsaXplZC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2NyZWVuU3RyZWFtO1xuICAgIH1cbiAgICBhc3luYyBmdW5jdGlvbiBzdGFydFNjcmVlblJlY29yZGluZygpIHtcbiAgICAgIGlmKGlzUmVjb3JkaW5nU3RvcHBlZCkgcmV0dXJuO1xuICAgICAgY29uc29sZS5sb2coXCJzdGFydGluZyBzY3JlZW4gcmVjb3JkaW5nIGFnYWluXCIpO1xuICAgICAgbGV0IHJlY29yZGVkQ2h1bmtzOiBCbG9iW10gPSBbXTtcbiAgICAgIGxldCByZWNvcmRlcjogUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGlzUmVjb3JkaW5nKSByZXR1cm47XG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiBcInJlY29yZGluZ1N0YXJ0ZWRcIiwgb3B0aW9uczoge1xuICAgICAgICAgICAgZGF0YTpcInJlY29yZGluZ1N0YXJ0ZWRcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgYXdhaXQgc3RvcmFnZS5zZXRJdGVtKFwibG9jYWw6aXNSZWNvcmRpbmdcIiwgXCJ0cnVlXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfjqwgU3RhcnRpbmcgbmV3IDIwLXNlY29uZCByZWNvcmRpbmcuLi5cIik7XG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IGdldFNjcmVlblN0cmVhbSgpO1xuICAgICAgICBjb25zdCByZWNvcmRlciA9IG5ldyBSZWNvcmRSVENQcm9taXNlc0hhbmRsZXIoc3RyZWFtLCB7XG4gICAgICAgICAgdHlwZTogXCJ2aWRlb1wiLFxuICAgICAgICAgIG1pbWVUeXBlOiBcInZpZGVvL3dlYm1cIixcbiAgICAgICAgICB0aW1lU2xpY2U6IDIwMDAwXG4gICAgICAgIH0pO1xuICAgICAgICBpc1JlY29yZGluZyA9IHRydWU7XG4gICAgICAgIHJlY29yZGVyLnN0YXJ0UmVjb3JkaW5nKCk7XG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHJlY29yZGVyLnN0b3BSZWNvcmRpbmcoKTtcbiAgICAgICAgICBpc1JlY29yZGluZyA9IGZhbHNlO1xuICAgICAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCByZWNvcmRlci5nZXRCbG9iKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coYmxvYik7XG4gICAgICAgICAgY29uc29sZS5sb2coXCLwn5uRIFJlY29yZGluZyBzdG9wcGVkLCBzZW5kaW5nIGZpbGUuLi5cIik7XG4gICAgICAgICAgaWYgKCFibG9iIHx8ICEoYmxvYiBpbnN0YW5jZW9mIEJsb2IpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi4p2MIEVycm9yOiBJbnZhbGlkIEJsb2IgcmVjZWl2ZWQuXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBzZW5kQ2h1bmtzVG9TZXJ2ZXIoYmxvYik7XG4gICAgICAgICAgc3RhcnRTY3JlZW5SZWNvcmRpbmcoKTtcbiAgICAgICAgfSwgMjAwMDApO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCLinYwgRXJyb3IgYWNjZXNzaW5nIG1lZGlhIGRldmljZXM6XCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGZ1bmN0aW9uIHNlbmRDaHVua3NUb1NlcnZlcihjaHVuazogQmxvYikge1xuICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZChcInZpZGVvX2NodW5rXCIsIGNodW5rLCBcInZpZGVvLndlYm1cIik7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cDovL2xvY2FsaG9zdDo1MDAwL3VwbG9hZC1jaHVua1wiLCB7XG4gICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICBib2R5OiBmb3JtRGF0YSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgY29uc29sZS5sb2coXCLinIUgQ2h1bmsgYmF0Y2ggdXBsb2FkZWQ6XCIsIGRhdGEpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIuKdjCBFcnJvciB1cGxvYWRpbmcgY2h1bmsgYmF0Y2g6XCIsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfSxcbn0pO1xuXG5cbmNvbnN0IHNob3dNZXNzYWdlUG9wdXAgPSAobWVzc2FnZTogc3RyaW5nKSA9PiB7XG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1lc3NhZ2UtcG9wdXAtb3ZlcmxheVwiKSkgcmV0dXJuO1xuICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgb3ZlcmxheS5pZCA9IFwibWVzc2FnZS1wb3B1cC1vdmVybGF5XCI7XG4gIG92ZXJsYXkuc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gIG92ZXJsYXkuc3R5bGUudG9wID0gXCIwXCI7XG4gIG92ZXJsYXkuc3R5bGUubGVmdCA9IFwiMFwiO1xuICBvdmVybGF5LnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gIG92ZXJsYXkuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gIG92ZXJsYXkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmdiYSgwLCAwLCAwLCAwLjYpXCI7XG4gIG92ZXJsYXkuc3R5bGUuekluZGV4ID0gXCIxMDAwMVwiO1xuICBvdmVybGF5LnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgb3ZlcmxheS5zdHlsZS5hbGlnbkl0ZW1zID0gXCJjZW50ZXJcIjtcbiAgb3ZlcmxheS5zdHlsZS5qdXN0aWZ5Q29udGVudCA9IFwiY2VudGVyXCI7XG4gIGNvbnN0IHBvcHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcG9wdXAuc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gIHBvcHVwLnN0eWxlLnRvcCA9IFwiNTAlXCI7XG4gIHBvcHVwLnN0eWxlLmxlZnQgPSBcIjUwJVwiO1xuICBwb3B1cC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgtNTAlLCAtNTAlKVwiO1xuICBwb3B1cC5zdHlsZS56SW5kZXggPSBcIjEwMDAwXCI7XG4gIHBvcHVwLnN0eWxlLmJhY2tncm91bmQgPSBcIiNmZmZcIjtcbiAgcG9wdXAuc3R5bGUuYm9yZGVyID0gXCIxcHggc29saWQgI2NjY1wiO1xuICBwb3B1cC5zdHlsZS5wYWRkaW5nID0gXCIyMHB4XCI7XG4gIHBvcHVwLnN0eWxlLmJveFNoYWRvdyA9IFwiMCAwIDEwcHggcmdiYSgwLCAwLCAwLCAwLjUpXCI7XG4gIHBvcHVwLnN0eWxlLndpZHRoID0gXCIzMDBweFwiO1xuICBwb3B1cC5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gIHBvcHVwLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSBcImNvbHVtblwiO1xuICBwb3B1cC5zdHlsZS5qdXN0aWZ5Q29udGVudCA9IFwiY2VudGVyXCI7XG4gIHBvcHVwLnN0eWxlLmFsaWduSXRlbXMgPSBcImNlbnRlclwiO1xuICBjb25zdCBtZXNzYWdlVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICBtZXNzYWdlVGV4dC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG4gIG1lc3NhZ2VUZXh0LnN0eWxlLm1hcmdpbkJvdHRvbSA9IFwiMjBweFwiO1xuICBtZXNzYWdlVGV4dC5zdHlsZS5jb2xvciA9IFwiYmxhY2tcIjtcbiAgbWVzc2FnZVRleHQuc3R5bGUudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcbiAgY29uc3QgY2xvc2VCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBjbG9zZUJ1dHRvbi50ZXh0Q29udGVudCA9IFwiQ2xvc2VcIjtcbiAgY2xvc2VCdXR0b24uc3R5bGUucGFkZGluZyA9IFwiMTBweCAyMHB4XCI7XG4gIGNsb3NlQnV0dG9uLnN0eWxlLmJvcmRlciA9IFwibm9uZVwiO1xuICBjbG9zZUJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNENBRjUwXCI7XG4gIGNsb3NlQnV0dG9uLnN0eWxlLmNvbG9yID0gXCIjZmZmXCI7XG4gIGNsb3NlQnV0dG9uLnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiNHB4XCI7XG4gIGNsb3NlQnV0dG9uLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xuICBjbG9zZUJ1dHRvbi5zdHlsZS5mb250U2l6ZSA9IFwiMTZweFwiO1xuICBjbG9zZUJ1dHRvbi5zdHlsZS53aWR0aCA9IFwibWF4LWNvbnRlbnRcIjtcbiAgY2xvc2VCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG92ZXJsYXkpO1xuICB9O1xuICBwb3B1cC5hcHBlbmRDaGlsZChtZXNzYWdlVGV4dCk7XG4gIHBvcHVwLmFwcGVuZENoaWxkKGNsb3NlQnV0dG9uKTtcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChwb3B1cCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3ZlcmxheSk7XG59O1xuY29uc3Qgc2hvd0xvYWRpbmdCYXIgPSAoKSA9PiB7XG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmctb3ZlcmxheVwiKSkgcmV0dXJuO1xuICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgb3ZlcmxheS5pZCA9IFwibG9hZGluZy1vdmVybGF5XCI7XG4gIG92ZXJsYXkuc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gIG92ZXJsYXkuc3R5bGUudG9wID0gXCIwXCI7XG4gIG92ZXJsYXkuc3R5bGUubGVmdCA9IFwiMFwiO1xuICBvdmVybGF5LnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gIG92ZXJsYXkuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gIG92ZXJsYXkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmdiYSgwLCAwLCAwLCAwLjYpXCI7XG4gIG92ZXJsYXkuc3R5bGUuekluZGV4ID0gXCIxMDAwMVwiO1xuICBvdmVybGF5LnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgb3ZlcmxheS5zdHlsZS5hbGlnbkl0ZW1zID0gXCJjZW50ZXJcIjtcbiAgb3ZlcmxheS5zdHlsZS5qdXN0aWZ5Q29udGVudCA9IFwiY2VudGVyXCI7XG4gIGNvbnN0IHNwaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzcGlubmVyLnN0eWxlLndpZHRoID0gXCI1MHB4XCI7XG4gIHNwaW5uZXIuc3R5bGUuaGVpZ2h0ID0gXCI1MHB4XCI7XG4gIHNwaW5uZXIuc3R5bGUuYm9yZGVyID0gXCI1cHggc29saWQgI2YzZjNmM1wiO1xuICBzcGlubmVyLnN0eWxlLmJvcmRlclRvcCA9IFwiNXB4IHNvbGlkICMzNDk4ZGJcIjtcbiAgc3Bpbm5lci5zdHlsZS5ib3JkZXJSYWRpdXMgPSBcIjUwJVwiO1xuICBzcGlubmVyLnN0eWxlLmFuaW1hdGlvbiA9IFwic3BpbiAxcyBsaW5lYXIgaW5maW5pdGVcIjtcblxuICBvdmVybGF5LmFwcGVuZENoaWxkKHNwaW5uZXIpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgc3R5bGUuaW5uZXJIVE1MID0gYFxuICAgIEBrZXlmcmFtZXMgc3BpbiB7XG4gICAgICAwJSB7IHRyYW5zZm9ybTogcm90YXRlKDBkZWcpOyB9XG4gICAgICAxMDAlIHsgdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgfVxuICAgIH1cbiAgYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59O1xuY29uc3QgaGlkZUxvYWRpbmdCYXIgPSAoKSA9PiB7XG4gIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmctb3ZlcmxheVwiKTtcbiAgaWYgKG92ZXJsYXkpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG92ZXJsYXkpO1xuICB9XG59OyIsImV4cG9ydCBjb25zdCBicm93c2VyID0gKFxuICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gIGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWQgPT0gbnVsbCA/IGdsb2JhbFRoaXMuY2hyb21lIDogKFxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgKVxuKTtcbiIsImZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuICBpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG4gIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhcmdzLnNoaWZ0KCk7XG4gICAgbWV0aG9kKGBbd3h0XSAke21lc3NhZ2V9YCwgLi4uYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSB7XG4gIGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG4gIGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcbiAgd2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG4gIGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG5leHBvcnQgY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgY29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcbiAgICBzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcbiAgICB0aGlzLm5ld1VybCA9IG5ld1VybDtcbiAgICB0aGlzLm9sZFVybCA9IG9sZFVybDtcbiAgfVxuICBzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG4gIHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcbiAgbGV0IGludGVydmFsO1xuICBsZXQgb2xkVXJsO1xuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgbG9jYXRpb24gd2F0Y2hlciBpcyBhY3RpdmVseSBsb29raW5nIGZvciBVUkwgY2hhbmdlcy4gSWYgaXQncyBhbHJlYWR5IHdhdGNoaW5nLFxuICAgICAqIHRoaXMgaXMgYSBub29wLlxuICAgICAqL1xuICAgIHJ1bigpIHtcbiAgICAgIGlmIChpbnRlcnZhbCAhPSBudWxsKSByZXR1cm47XG4gICAgICBvbGRVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuICAgICAgaW50ZXJ2YWwgPSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBsZXQgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgaWYgKG5ld1VybC5ocmVmICE9PSBvbGRVcmwuaHJlZikge1xuICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgb2xkVXJsKSk7XG4gICAgICAgICAgb2xkVXJsID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9LCAxZTMpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi8uLi9zYW5kYm94L3V0aWxzL2xvZ2dlci5tanNcIjtcbmltcG9ydCB7IGdldFVuaXF1ZUV2ZW50TmFtZSB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuZXhwb3J0IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcbiAgY29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBpZiAodGhpcy5pc1RvcEZyYW1lKSB7XG4gICAgICB0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cyh7IGlnbm9yZUZpcnN0RXZlbnQ6IHRydWUgfSk7XG4gICAgICB0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG4gICAgfVxuICB9XG4gIHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXG4gICAgXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiXG4gICk7XG4gIGlzVG9wRnJhbWUgPSB3aW5kb3cuc2VsZiA9PT0gd2luZG93LnRvcDtcbiAgYWJvcnRDb250cm9sbGVyO1xuICBsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG4gIGdldCBzaWduYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcbiAgfVxuICBhYm9ydChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcbiAgfVxuICBnZXQgaXNJbnZhbGlkKCkge1xuICAgIGlmIChicm93c2VyLnJ1bnRpbWUuaWQgPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcbiAgfVxuICBnZXQgaXNWYWxpZCgpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG4gICAqIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG4gICAqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG4gICAqIH0pXG4gICAqIC8vIC4uLlxuICAgKiByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG4gICAqL1xuICBvbkludmFsaWRhdGVkKGNiKSB7XG4gICAgdGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb24gdGhhdCBzaG91bGRuJ3QgcnVuXG4gICAqIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG4gICAqICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcbiAgICpcbiAgICogICAvLyAuLi5cbiAgICogfVxuICAgKi9cbiAgYmxvY2soKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWwgd2hlbiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbCB3aGVuIGludmFsaWRhdGVkLlxuICAgKi9cbiAgc2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG4gICAgY29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuICAgIGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICB9KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHJlcXVlc3RJZGxlQ2FsbGJhY2soY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICBjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soKC4uLmFyZ3MpID0+IHtcbiAgICAgIGlmICghdGhpcy5zaWduYWwuYWJvcnRlZCkgY2FsbGJhY2soLi4uYXJncyk7XG4gICAgfSwgb3B0aW9ucyk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbElkbGVDYWxsYmFjayhpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICBhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlID09PSBcInd4dDpsb2NhdGlvbmNoYW5nZVwiKSB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSB0aGlzLmxvY2F0aW9uV2F0Y2hlci5ydW4oKTtcbiAgICB9XG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXI/LihcbiAgICAgIHR5cGUuc3RhcnRzV2l0aChcInd4dDpcIikgPyBnZXRVbmlxdWVFdmVudE5hbWUodHlwZSkgOiB0eXBlLFxuICAgICAgaGFuZGxlcixcbiAgICAgIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgc2lnbmFsOiB0aGlzLnNpZ25hbFxuICAgICAgfVxuICAgICk7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBBYm9ydCB0aGUgYWJvcnQgY29udHJvbGxlciBhbmQgZXhlY3V0ZSBhbGwgYG9uSW52YWxpZGF0ZWRgIGxpc3RlbmVycy5cbiAgICovXG4gIG5vdGlmeUludmFsaWRhdGVkKCkge1xuICAgIHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuICAgIGxvZ2dlci5kZWJ1ZyhcbiAgICAgIGBDb250ZW50IHNjcmlwdCBcIiR7dGhpcy5jb250ZW50U2NyaXB0TmFtZX1cIiBjb250ZXh0IGludmFsaWRhdGVkYFxuICAgICk7XG4gIH1cbiAgc3RvcE9sZFNjcmlwdHMoKSB7XG4gICAgd2luZG93LnBvc3RNZXNzYWdlKFxuICAgICAge1xuICAgICAgICB0eXBlOiBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsXG4gICAgICAgIGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lXG4gICAgICB9LFxuICAgICAgXCIqXCJcbiAgICApO1xuICB9XG4gIGxpc3RlbkZvck5ld2VyU2NyaXB0cyhvcHRpb25zKSB7XG4gICAgbGV0IGlzRmlyc3QgPSB0cnVlO1xuICAgIGNvbnN0IGNiID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQuZGF0YT8udHlwZSA9PT0gQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFICYmIGV2ZW50LmRhdGE/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lKSB7XG4gICAgICAgIGNvbnN0IHdhc0ZpcnN0ID0gaXNGaXJzdDtcbiAgICAgICAgaXNGaXJzdCA9IGZhbHNlO1xuICAgICAgICBpZiAod2FzRmlyc3QgJiYgb3B0aW9ucz8uaWdub3JlRmlyc3RFdmVudCkgcmV0dXJuO1xuICAgICAgICB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBhZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBjYik7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNiKSk7XG4gIH1cbn1cbiIsImNvbnN0IG51bGxLZXkgPSBTeW1ib2woJ251bGwnKTsgLy8gYG9iamVjdEhhc2hlc2Aga2V5IGZvciBudWxsXG5cbmxldCBrZXlDb3VudGVyID0gMDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFueUtleXNNYXAgZXh0ZW5kcyBNYXAge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5fb2JqZWN0SGFzaGVzID0gbmV3IFdlYWtNYXAoKTtcblx0XHR0aGlzLl9zeW1ib2xIYXNoZXMgPSBuZXcgTWFwKCk7IC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YzM5L2VjbWEyNjIvaXNzdWVzLzExOTRcblx0XHR0aGlzLl9wdWJsaWNLZXlzID0gbmV3IE1hcCgpO1xuXG5cdFx0Y29uc3QgW3BhaXJzXSA9IGFyZ3VtZW50czsgLy8gTWFwIGNvbXBhdFxuXHRcdGlmIChwYWlycyA9PT0gbnVsbCB8fCBwYWlycyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwYWlyc1tTeW1ib2wuaXRlcmF0b3JdICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKHR5cGVvZiBwYWlycyArICcgaXMgbm90IGl0ZXJhYmxlIChjYW5ub3QgcmVhZCBwcm9wZXJ0eSBTeW1ib2woU3ltYm9sLml0ZXJhdG9yKSknKTtcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IFtrZXlzLCB2YWx1ZV0gb2YgcGFpcnMpIHtcblx0XHRcdHRoaXMuc2V0KGtleXMsIHZhbHVlKTtcblx0XHR9XG5cdH1cblxuXHRfZ2V0UHVibGljS2V5cyhrZXlzLCBjcmVhdGUgPSBmYWxzZSkge1xuXHRcdGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGtleXMgcGFyYW1ldGVyIG11c3QgYmUgYW4gYXJyYXknKTtcblx0XHR9XG5cblx0XHRjb25zdCBwcml2YXRlS2V5ID0gdGhpcy5fZ2V0UHJpdmF0ZUtleShrZXlzLCBjcmVhdGUpO1xuXG5cdFx0bGV0IHB1YmxpY0tleTtcblx0XHRpZiAocHJpdmF0ZUtleSAmJiB0aGlzLl9wdWJsaWNLZXlzLmhhcyhwcml2YXRlS2V5KSkge1xuXHRcdFx0cHVibGljS2V5ID0gdGhpcy5fcHVibGljS2V5cy5nZXQocHJpdmF0ZUtleSk7XG5cdFx0fSBlbHNlIGlmIChjcmVhdGUpIHtcblx0XHRcdHB1YmxpY0tleSA9IFsuLi5rZXlzXTsgLy8gUmVnZW5lcmF0ZSBrZXlzIGFycmF5IHRvIGF2b2lkIGV4dGVybmFsIGludGVyYWN0aW9uXG5cdFx0XHR0aGlzLl9wdWJsaWNLZXlzLnNldChwcml2YXRlS2V5LCBwdWJsaWNLZXkpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7cHJpdmF0ZUtleSwgcHVibGljS2V5fTtcblx0fVxuXG5cdF9nZXRQcml2YXRlS2V5KGtleXMsIGNyZWF0ZSA9IGZhbHNlKSB7XG5cdFx0Y29uc3QgcHJpdmF0ZUtleXMgPSBbXTtcblx0XHRmb3IgKGxldCBrZXkgb2Yga2V5cykge1xuXHRcdFx0aWYgKGtleSA9PT0gbnVsbCkge1xuXHRcdFx0XHRrZXkgPSBudWxsS2V5O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBoYXNoZXMgPSB0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nID8gJ19vYmplY3RIYXNoZXMnIDogKHR5cGVvZiBrZXkgPT09ICdzeW1ib2wnID8gJ19zeW1ib2xIYXNoZXMnIDogZmFsc2UpO1xuXG5cdFx0XHRpZiAoIWhhc2hlcykge1xuXHRcdFx0XHRwcml2YXRlS2V5cy5wdXNoKGtleSk7XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXNbaGFzaGVzXS5oYXMoa2V5KSkge1xuXHRcdFx0XHRwcml2YXRlS2V5cy5wdXNoKHRoaXNbaGFzaGVzXS5nZXQoa2V5KSk7XG5cdFx0XHR9IGVsc2UgaWYgKGNyZWF0ZSkge1xuXHRcdFx0XHRjb25zdCBwcml2YXRlS2V5ID0gYEBAbWttLXJlZi0ke2tleUNvdW50ZXIrK31AQGA7XG5cdFx0XHRcdHRoaXNbaGFzaGVzXS5zZXQoa2V5LCBwcml2YXRlS2V5KTtcblx0XHRcdFx0cHJpdmF0ZUtleXMucHVzaChwcml2YXRlS2V5KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkocHJpdmF0ZUtleXMpO1xuXHR9XG5cblx0c2V0KGtleXMsIHZhbHVlKSB7XG5cdFx0Y29uc3Qge3B1YmxpY0tleX0gPSB0aGlzLl9nZXRQdWJsaWNLZXlzKGtleXMsIHRydWUpO1xuXHRcdHJldHVybiBzdXBlci5zZXQocHVibGljS2V5LCB2YWx1ZSk7XG5cdH1cblxuXHRnZXQoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gc3VwZXIuZ2V0KHB1YmxpY0tleSk7XG5cdH1cblxuXHRoYXMoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gc3VwZXIuaGFzKHB1YmxpY0tleSk7XG5cdH1cblxuXHRkZWxldGUoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXksIHByaXZhdGVLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gQm9vbGVhbihwdWJsaWNLZXkgJiYgc3VwZXIuZGVsZXRlKHB1YmxpY0tleSkgJiYgdGhpcy5fcHVibGljS2V5cy5kZWxldGUocHJpdmF0ZUtleSkpO1xuXHR9XG5cblx0Y2xlYXIoKSB7XG5cdFx0c3VwZXIuY2xlYXIoKTtcblx0XHR0aGlzLl9zeW1ib2xIYXNoZXMuY2xlYXIoKTtcblx0XHR0aGlzLl9wdWJsaWNLZXlzLmNsZWFyKCk7XG5cdH1cblxuXHRnZXQgW1N5bWJvbC50b1N0cmluZ1RhZ10oKSB7XG5cdFx0cmV0dXJuICdNYW55S2V5c01hcCc7XG5cdH1cblxuXHRnZXQgc2l6ZSgpIHtcblx0XHRyZXR1cm4gc3VwZXIuc2l6ZTtcblx0fVxufVxuIiwiaW1wb3J0IE1hbnlLZXlzTWFwIGZyb20gJ21hbnkta2V5cy1tYXAnO1xuaW1wb3J0IHsgZGVmdSB9IGZyb20gJ2RlZnUnO1xuaW1wb3J0IHsgaXNFeGlzdCB9IGZyb20gJy4vZGV0ZWN0b3JzLm1qcyc7XG5cbmNvbnN0IGdldERlZmF1bHRPcHRpb25zID0gKCkgPT4gKHtcbiAgdGFyZ2V0OiBnbG9iYWxUaGlzLmRvY3VtZW50LFxuICB1bmlmeVByb2Nlc3M6IHRydWUsXG4gIGRldGVjdG9yOiBpc0V4aXN0LFxuICBvYnNlcnZlQ29uZmlnczoge1xuICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICBzdWJ0cmVlOiB0cnVlLFxuICAgIGF0dHJpYnV0ZXM6IHRydWVcbiAgfSxcbiAgc2lnbmFsOiB2b2lkIDAsXG4gIGN1c3RvbU1hdGNoZXI6IHZvaWQgMFxufSk7XG5jb25zdCBtZXJnZU9wdGlvbnMgPSAodXNlclNpZGVPcHRpb25zLCBkZWZhdWx0T3B0aW9ucykgPT4ge1xuICByZXR1cm4gZGVmdSh1c2VyU2lkZU9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKTtcbn07XG5cbmNvbnN0IHVuaWZ5Q2FjaGUgPSBuZXcgTWFueUtleXNNYXAoKTtcbmZ1bmN0aW9uIGNyZWF0ZVdhaXRFbGVtZW50KGluc3RhbmNlT3B0aW9ucykge1xuICBjb25zdCB7IGRlZmF1bHRPcHRpb25zIH0gPSBpbnN0YW5jZU9wdGlvbnM7XG4gIHJldHVybiAoc2VsZWN0b3IsIG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICB0YXJnZXQsXG4gICAgICB1bmlmeVByb2Nlc3MsXG4gICAgICBvYnNlcnZlQ29uZmlncyxcbiAgICAgIGRldGVjdG9yLFxuICAgICAgc2lnbmFsLFxuICAgICAgY3VzdG9tTWF0Y2hlclxuICAgIH0gPSBtZXJnZU9wdGlvbnMob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xuICAgIGNvbnN0IHVuaWZ5UHJvbWlzZUtleSA9IFtcbiAgICAgIHNlbGVjdG9yLFxuICAgICAgdGFyZ2V0LFxuICAgICAgdW5pZnlQcm9jZXNzLFxuICAgICAgb2JzZXJ2ZUNvbmZpZ3MsXG4gICAgICBkZXRlY3RvcixcbiAgICAgIHNpZ25hbCxcbiAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICBdO1xuICAgIGNvbnN0IGNhY2hlZFByb21pc2UgPSB1bmlmeUNhY2hlLmdldCh1bmlmeVByb21pc2VLZXkpO1xuICAgIGlmICh1bmlmeVByb2Nlc3MgJiYgY2FjaGVkUHJvbWlzZSkge1xuICAgICAgcmV0dXJuIGNhY2hlZFByb21pc2U7XG4gICAgfVxuICAgIGNvbnN0IGRldGVjdFByb21pc2UgPSBuZXcgUHJvbWlzZShcbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9Bc3luY1Byb21pc2VFeGVjdXRvcjogYXZvaWQgbmVzdGluZyBwcm9taXNlXG4gICAgICBhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHNpZ25hbC5yZWFzb24pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoXG4gICAgICAgICAgYXN5bmMgKG11dGF0aW9ucykgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBfIG9mIG11dGF0aW9ucykge1xuICAgICAgICAgICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnN0IGRldGVjdFJlc3VsdDIgPSBhd2FpdCBkZXRlY3RFbGVtZW50KHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcixcbiAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IsXG4gICAgICAgICAgICAgICAgY3VzdG9tTWF0Y2hlclxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgaWYgKGRldGVjdFJlc3VsdDIuaXNEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRldGVjdFJlc3VsdDIucmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwiYWJvcnRcIixcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHNpZ25hbC5yZWFzb24pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBvbmNlOiB0cnVlIH1cbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZGV0ZWN0UmVzdWx0ID0gYXdhaXQgZGV0ZWN0RWxlbWVudCh7XG4gICAgICAgICAgc2VsZWN0b3IsXG4gICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgIGRldGVjdG9yLFxuICAgICAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChkZXRlY3RSZXN1bHQuaXNEZXRlY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKGRldGVjdFJlc3VsdC5yZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUodGFyZ2V0LCBvYnNlcnZlQ29uZmlncyk7XG4gICAgICB9XG4gICAgKS5maW5hbGx5KCgpID0+IHtcbiAgICAgIHVuaWZ5Q2FjaGUuZGVsZXRlKHVuaWZ5UHJvbWlzZUtleSk7XG4gICAgfSk7XG4gICAgdW5pZnlDYWNoZS5zZXQodW5pZnlQcm9taXNlS2V5LCBkZXRlY3RQcm9taXNlKTtcbiAgICByZXR1cm4gZGV0ZWN0UHJvbWlzZTtcbiAgfTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGRldGVjdEVsZW1lbnQoe1xuICB0YXJnZXQsXG4gIHNlbGVjdG9yLFxuICBkZXRlY3RvcixcbiAgY3VzdG9tTWF0Y2hlclxufSkge1xuICBjb25zdCBlbGVtZW50ID0gY3VzdG9tTWF0Y2hlciA/IGN1c3RvbU1hdGNoZXIoc2VsZWN0b3IpIDogdGFyZ2V0LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICByZXR1cm4gYXdhaXQgZGV0ZWN0b3IoZWxlbWVudCk7XG59XG5jb25zdCB3YWl0RWxlbWVudCA9IGNyZWF0ZVdhaXRFbGVtZW50KHtcbiAgZGVmYXVsdE9wdGlvbnM6IGdldERlZmF1bHRPcHRpb25zKClcbn0pO1xuXG5leHBvcnQgeyBjcmVhdGVXYWl0RWxlbWVudCwgZ2V0RGVmYXVsdE9wdGlvbnMsIHdhaXRFbGVtZW50IH07XG4iXSwibmFtZXMiOlsiZGVmaW5pdGlvbiIsInJlc3VsdCIsImJyb3dzZXIiLCJfYSIsIlJlY29yZFJUQyIsInNlbGYiLCJVUkwiLCJibG9iIiwiY2FsbGJhY2siLCJnbG9iYWwiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsImNvbmZpZyIsIm51bWJlck9mQXVkaW9DaGFubmVscyIsInNhbXBsZVJhdGUiLCJkZXNpcmVkU2FtcFJhdGUiLCJpIiwibG5nIiwiYnVmZmVyIiwiaW5kZXgiLCJ2aWV3IiwibGFzdFRpbWUiLCJkdXJhdGlvbiIsImZyYW1lcyIsIkVCTUwiLCJicm93c2VyRmFrZVVzZXJBZ2VudCIsIkF1ZGlvQ29udGV4dCIsIk1lZGlhU3RyZWFtIiwiU3RvcmFnZSIsInNldFNyY09iamVjdCIsInN0cmVhbSIsInJlY29yZGVyIiwiUmVjb3JkUlRDUHJvbWlzZXNIYW5kbGVyIiwicHJpbnQiLCJsb2dnZXIiLCJfYiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQU8sV0FBUyxvQkFBb0JBLGFBQVk7QUFDOUMsV0FBT0E7QUFBQSxFQUNUO0FD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cEMsWUFBTSxjQUFjLENBQUU7QUFDdEIsZUFBUyxPQUFPLE1BQU07QUFDckIsWUFBSSxRQUFRLE1BQU07QUFDakIsZ0JBQU07QUFBQSxRQUNWO0FBRUcsY0FBTSxTQUFTLE9BQU8sUUFBUSxZQUFZLE9BQU8sUUFBUSxhQUFhLGtCQUFtQixPQUFPLFFBQVEsV0FBVyxrQkFBa0I7QUFFckksWUFBSSxDQUFDLFFBQVE7QUFDWixzQkFBWSxLQUFLLEdBQUc7QUFBQSxRQUNwQixXQUFVLEtBQUssTUFBTSxFQUFFLElBQUksR0FBRyxHQUFHO0FBQ2pDLHNCQUFZLEtBQUssS0FBSyxNQUFNLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFBQSxRQUN0QyxXQUFVLFFBQVE7QUFDbEIsZ0JBQU0sYUFBYSxhQUFhLFlBQVk7QUFDNUMsZUFBSyxNQUFNLEVBQUUsSUFBSSxLQUFLLFVBQVU7QUFDaEMsc0JBQVksS0FBSyxVQUFVO0FBQUEsUUFDL0IsT0FBVTtBQUNOLGlCQUFPO0FBQUEsUUFDWDtBQUFBLE1BQ0E7QUFFRSxhQUFPLEtBQUssVUFBVSxXQUFXO0FBQUEsSUFDbkM7QUFBQSxJQUVDLElBQUksTUFBTSxPQUFPO0FBQ2hCLFlBQU0sRUFBQyxVQUFTLElBQUksS0FBSyxlQUFlLE1BQU0sSUFBSTtBQUNsRCxhQUFPLE1BQU0sSUFBSSxXQUFXLEtBQUs7QUFBQSxJQUNuQztBQUFBLElBRUMsSUFBSSxNQUFNO0FBQ1QsWUFBTSxFQUFDLFVBQVMsSUFBSSxLQUFLLGVBQWUsSUFBSTtBQUM1QyxhQUFPLE1BQU0sSUFBSSxTQUFTO0FBQUEsSUFDNUI7QUFBQSxJQUVDLElBQUksTUFBTTtBQUNULFlBQU0sRUFBQyxVQUFTLElBQUksS0FBSyxlQUFlLElBQUk7QUFDNUMsYUFBTyxNQUFNLElBQUksU0FBUztBQUFBLElBQzVCO0FBQUEsSUFFQyxPQUFPLE1BQU07QUFDWixZQUFNLEVBQUMsV0FBVyxXQUFVLElBQUksS0FBSyxlQUFlLElBQUk7QUFDeEQsYUFBTyxRQUFRLGFBQWEsTUFBTSxPQUFPLFNBQVMsS0FBSyxLQUFLLFlBQVksT0FBTyxVQUFVLENBQUM7QUFBQSxJQUM1RjtBQUFBLElBRUMsUUFBUTtBQUNQLFlBQU0sTUFBTztBQUNiLFdBQUssY0FBYyxNQUFPO0FBQzFCLFdBQUssWUFBWSxNQUFPO0FBQUEsSUFDMUI7QUFBQSxJQUVDLEtBQUssT0FBTyxXQUFXLElBQUk7QUFDMUIsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUVDLElBQUksT0FBTztBQUNWLGFBQU8sTUFBTTtBQUFBLElBQ2Y7QUFBQSxFQUNBO0FDbEZtQixNQUFJLFlBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsMyw1LDcsOCw5LDEwLDExLDEyLDEzXX0=
