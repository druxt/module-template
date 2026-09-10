import NuxtModule from '../src'

const options = {
  baseUrl: 'https://demo-api.druxtjs.org',
  endpoint: '/jsonapi',
}

let mock

describe('DruxtModule Nuxt module', () => {
  beforeEach(() => {
    mock = {
      addModule: jest.fn(),
      addTemplate: jest.fn(),
      extendRoutes: jest.fn(),
      nuxt: {
        hook: jest.fn(),
      },
      options: {},
      NuxtModule,
    }
  })

  test('Init', () => {
    // Add Nuxt hook mock handler.
    const dirs = []
    mock.nuxt.hook = jest.fn((hook, fn) => fn(dirs))

    // Call Druxt module with module options.
    NuxtModule.call(mock, options)

    // Expect that:
    // - The components:dirs hook was invoked.
    // - One directory is present.
    expect(mock.nuxt.hook).toHaveBeenCalledWith(
      'components:dirs',
      expect.any(Function)
    )
    expect(dirs.length).toBe(1)
  })

  test('Init without module options', () => {
    // The `moduleOptions = {}` default is a branch, and calling the module
    // with options every time never takes it. Nuxt calls a module with no
    // options whenever it is registered as a bare string in `buildModules`,
    // which is how the example application registers this one.
    const dirs = []
    mock.nuxt.hook = jest.fn((hook, fn) => fn(dirs))

    NuxtModule.call(mock)

    expect(mock.nuxt.hook).toHaveBeenCalledWith(
      'components:dirs',
      expect.any(Function)
    )
    expect(dirs.length).toBe(1)
  })
})
