#define MyAppName "S Ultimate Messenger"
#define MyAppVersion "0.1alpha"
#define MyAppPublisher "Tobias Zeising"
#define MyAppURL "https://github.com/ssilence/sum"
#define LaunchProgram "Starte S Ultimate Messenger nach der Installation"
#define DesktopIcon "Verknüpfung auf dem Desktop"
#define CreateDesktopIcon "Wollen Sie eine Verknüpfung auf dem Desktop erstellen?"

[Setup]
AppId={{F3E30478-2D70-4CBC-AB4F-0B7A0A4D44AB}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
Compression=lzma
SolidCompression=yes
OutputDir=.
OutputBaseFilename=sum-setup-{#MyAppVersion}

[Languages]
Name: "german"; MessagesFile: "compiler:Languages\German.isl"

[Files]
Source: "*"; Excludes: ".git,setup.iss,config_ext*,sum-setup*,website*" ; DestDir: "{app}"; Flags: ignoreversion recursesubdirs
Source: "app/favicon.ico"; DestDir: "{app}"; DestName: "icon.ico"; Flags: ignoreversion

[Tasks]
Name: "desktopicon"; Description: "{#CreateDesktopIcon}"; GroupDescription: "{#DesktopIcon}"

[Icons]
Name: "{group}\SUM - S Ultimate Messenger"; Filename: "{app}\nw.exe"; WorkingDir: "{app}"; IconFilename: "{app}/icon.ico"
Name: "{userstartup}\SUM - S Ultimate Messenger"; Filename: "{app}\nw.exe"; WorkingDir: "{app}"; IconFilename: "{app}/icon.ico"
Name: "{userdesktop}\SUM - S Ultimate Messenger"; Filename: "{app}\nw.exe"; WorkingDir: "{app}"; IconFilename: "{app}/icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\nw.exe"; WorkingDir: "{app}"; Description: {#LaunchProgram}; Flags: postinstall shellexec