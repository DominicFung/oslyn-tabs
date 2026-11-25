#import "SceneDelegate.h"
#import "AppDelegate.h"

static NSDictionary *LaunchOptionsFromConnection(UISceneConnectionOptions *connectionOptions)
{
  NSMutableDictionary *launchOptions = [NSMutableDictionary dictionary];
  UIOpenURLContext *urlContext = connectionOptions.URLContexts.anyObject;
  if (urlContext.URL) {
    launchOptions[UIApplicationLaunchOptionsURLKey] = urlContext.URL;
  }
  NSUserActivity *activity = connectionOptions.userActivities.anyObject;
  if (activity.activityType) {
    launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey] = @{
      UIApplicationLaunchOptionsUserActivityTypeKey : activity.activityType,
      @"UIApplicationLaunchOptionsUserActivityKey" : activity,
    };
  }
  return launchOptions;
}

static NSDictionary<UIApplicationOpenURLOptionsKey, id> *OptionsFromURLContext(UIOpenURLContext *context)
{
  NSMutableDictionary *options = [NSMutableDictionary dictionary];
  if (context.options.sourceApplication) {
    options[UIApplicationOpenURLOptionsSourceApplicationKey] = context.options.sourceApplication;
  }
  if (context.options.annotation) {
    options[UIApplicationOpenURLOptionsAnnotationKey] = context.options.annotation;
  }
  options[UIApplicationOpenURLOptionsOpenInPlaceKey] = @(context.options.openInPlace);
  return options;
}

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }

  AppDelegate *appDelegate = (AppDelegate *)UIApplication.sharedApplication.delegate;
  UIWindowScene *windowScene = (UIWindowScene *)scene;
  NSDictionary *launchOptions = LaunchOptionsFromConnection(connectionOptions);

  UIView *rootView = [appDelegate.rootViewFactory viewWithModuleName:appDelegate.moduleName
                                                   initialProperties:appDelegate.initialProps
                                                       launchOptions:launchOptions];
  UIViewController *rootViewController = [appDelegate createRootViewController];
  [appDelegate setRootView:rootView toRootViewController:rootViewController];

  UIWindow *window = [[UIWindow alloc] initWithWindowScene:windowScene];
  window.rootViewController = rootViewController;
  self.window = window;
  // RCTLogBox and other RN UI still read the app delegate's window.
  appDelegate.window = window;
  [window makeKeyAndVisible];
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  AppDelegate *appDelegate = (AppDelegate *)UIApplication.sharedApplication.delegate;
  for (UIOpenURLContext *context in URLContexts) {
    // AppDelegate forwards to Expo subscribers, then RCTLinkingManager.
    // expo-auth-session returns through {bundle id}:/oauthredirect.
    [appDelegate application:UIApplication.sharedApplication
                     openURL:context.URL
                     options:OptionsFromURLContext(context)];
  }
}

- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity
{
  AppDelegate *appDelegate = (AppDelegate *)UIApplication.sharedApplication.delegate;
  [appDelegate application:UIApplication.sharedApplication
      continueUserActivity:userActivity
        restorationHandler:^(NSArray<id<UIUserActivityRestoring>> *_Nullable restorableObjects){
        }];
}

@end
