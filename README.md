Ubuntu 14.04 LTS(64bit Version)
1) PMU Tracker Build
 * Download Odroid-U3 kernel 3.0.51 (git: e89ae4a6e68699f03ed481324af17a1954feb73f)
 * Patch: / of Kernel Source code
   - patch -p0 < pmu_tracker.patch
 * Kernel build: Execute build-pmu-enable.sh
 * Flash kernel image(zimage) to Odroid-U3 using fastboot
2) V8 Profiler Build
 * Download Crosswalk Source code
  a) Preparation
    - $ export XWLAK_OS_ANDROID=1
    - $ mkdir crosswalk-src
    - $ cd crosswalk-src
    - $ echo "{ 'GYP_DEFINES': 'OS=android target_arch=arm', }" > chromium.gyp_env
    - $ gclient config --name=src/xwalk https://github.com/crosswalk-project/crosswalk.git
  b) Source Code download
    - $ gclient sync
 * Patch
  a) Two Patches
    - v8_profiler_v8.patch
	 : directory of patch: src/v8
    - v8_profiler_blink.patch
	 : directory of patch: src/third_party/WebKit/Source
 * Build
   a) Build Preparation
    - $ export GYP_GENERATORS='ninja'
    - $ python xwalk/gyp_xwalk
   b) Crosswalk Shared Library Build (Release Mode)
    - $ ninja -C out/Release xwalk_runtime_lib_apk
   c) Output: Android application(apk)
   4) Install
    - $ adb install -r out/Release/apks/XWalkRuntimeLib.apk
3) Trace Analyzer
 * Node.js Install(Up to v0.14.0)
   - $ apt-get install nodejs
 * Execute Trace Analyzer
   - $ node trace-analyzer.js
4) Workload
 * need to insert code to Web Application
  - Application Start :  Console.log("ICTime Start")
  - Application End: Console.log("ICTime End")
5) Execution
 a) Connect Host PC to Mobile Device using USB interface
 b) Script Setting
  - $ adb push pmu_trace_enable.sh /sdcard/
  - $ adb shell
  - $ chmod 755 /sdcard/pmu_trace_enable.sh
 c) Start Tracing
  - $ sh pmu_trace_enable.sh
 d) Execute Crosswalk Application
 e) Stop Tracing (Contol + C)
 f) Rename Trace output
  - $ mv trace_pipe [Name].trace
 g) Analysis Trace 
  - $ node trace-analyzer.js
