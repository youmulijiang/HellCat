export interface AppTranslationSchema {
  common: {
    actions: {
      add: string;
      edit: string;
      delete: string;
      save: string;
      cancel: string;
      confirm: string;
      refresh: string;
      search: string;
      import: string;
      export: string;
      copy: string;
      connect: string;
      disconnect: string;
      clear: string;
      open: string;
      start: string;
      stop: string;
      pause: string;
      resume: string;
      retry: string;
      run: string;
      inject: string;
      fill: string;
    };
    feedback: {
      saveSuccess: string;
      saveFailed: string;
      deleteSuccess: string;
      copySuccess: string;
      copyFailed: string;
    };
    fields: {
      name: string;
      value: string;
      domain: string;
      path: string;
      protocol: string;
      host: string;
      port: string;
      username: string;
      password: string;
      secure: string;
      httpOnly: string;
      sameSite: string;
      expirationDate: string;
      text: string;
      code: string;
      scriptName: string;
      variableName: string;
    };
    labels: {
      quickAdd: string;
    };
    status: {
      loading: string;
      moduleInDevelopment: string;
      completed: string;
      paused: string;
      running: string;
      pending: string;
      current: string;
      stopping: string;
      unknown: string;
    };
  };
  popup: {
    tabs: {
      home: string;
      infoCollect: string;
      vueCrack: string;
      proxy: string;
      inject: string;
      cookie: string;
      dork: string;
      urlOpener: string;
      note: string;
    };
    home: {
      logoAlt: string;
      tagline: string;
      author: string;
    };
    infoCollect: {
      searchPlaceholder: string;
      countLabel: string;
      empty: string;
      tooltips: {
        copyAll: string;
        source: string;
      };
      messages: {
        copiedSection: string;
      };
      sections: {
        domains: string;
        absoluteApis: string;
        apis: string;
        ips: string;
        phones: string;
        emails: string;
        idcards: string;
        jwts: string;
        credentials: string;
        idKeys: string;
        urls: string;
        jsFiles: string;
      };
    };
    dork: {
      labels: {
        freeText: string;
        generatedQuery: string;
      };
      placeholders: {
        freeText: string;
      };
      emptyPreview: string;
      tooltips: {
        copyQuery: string;
        include: string;
        exclude: string;
        clickToSearch: string;
      };
      messages: {
        inputRequired: string;
      };
      operators: {
        google: {
          site: {
            label: string;
            placeholder: string;
          };
          inurl: {
            label: string;
            placeholder: string;
          };
          intitle: {
            label: string;
            placeholder: string;
          };
          intext: {
            label: string;
            placeholder: string;
          };
          filetype: {
            label: string;
            placeholder: string;
          };
          ext: {
            label: string;
            placeholder: string;
          };
          cache: {
            label: string;
            placeholder: string;
          };
          link: {
            label: string;
            placeholder: string;
          };
          related: {
            label: string;
            placeholder: string;
          };
          info: {
            label: string;
            placeholder: string;
          };
        };
        github: {
          org: {
            label: string;
            placeholder: string;
          };
          user: {
            label: string;
            placeholder: string;
          };
          repo: {
            label: string;
            placeholder: string;
          };
          path: {
            label: string;
            placeholder: string;
          };
          filename: {
            label: string;
            placeholder: string;
          };
          extension: {
            label: string;
            placeholder: string;
          };
          language: {
            label: string;
            placeholder: string;
          };
          in: {
            label: string;
            placeholder: string;
          };
        };
      };
    };
    vueCrack: {
      status: {
        detecting: string;
        notDetected: string;
        routerNotDetected: string;
        modifiedRoutes: string;
        guardsCleared: string;
      };
      actions: {
        detect: string;
        redetect: string;
        copyPaths: string;
        copyUrls: string;
        resetBasePath: string;
      };
      labels: {
        router: string;
        basePath: string;
        custom: string;
        inferred: string;
        none: string;
      };
      placeholders: {
        basePath: string;
      };
      tooltips: {
        editBasePath: string;
        copyUrl: string;
        openPage: string;
      };
      empty: {
        noRoutes: string;
      };
      messages: {
        copiedPaths: string;
        copiedUrls: string;
      };
      errors: {
        noActiveTab: string;
        pageConnectionFailed: string;
      };
    };
    cookie: {
      unknownDomain: string;
      searchPlaceholder: string;
      empty: string;
      confirmDeleteAll: string;
      tooltips: {
        copyAll: string;
        exportJson: string;
        importFromClipboard: string;
        deleteAll: string;
        copyValue: string;
      };
      messages: {
        copiedAll: string;
        exportedToClipboard: string;
        importSuccess: string;
        importFailed: string;
        deletedAll: string;
      };
      modal: {
        addTitle: string;
        editTitle: string;
        namePlaceholder: string;
        valuePlaceholder: string;
        expirationPlaceholder: string;
      };
      validation: {
        nameRequired: string;
        valueRequired: string;
        domainRequired: string;
        pathRequired: string;
      };
      sameSite: {
        unspecified: string;
        lax: string;
        strict: string;
        none: string;
      };
    };
    proxy: {
      addProfile: string;
      currentMode: string;
      empty: string;
      confirmDelete: string;
      modeLabels: {
        direct: string;
        system: string;
        systemProxy: string;
        active: string;
      };
      tooltips: {
        bypassList: string;
      };
      modal: {
        addTitle: string;
        editTitle: string;
        namePlaceholder: string;
        usernameOptional: string;
        passwordOptional: string;
        optionalPlaceholder: string;
        bypassListOptional: string;
        bypassPlaceholder: string;
        bypassModalTitle: string;
        bypassDescription: string;
        bypassInputPlaceholder: string;
        bypassEmpty: string;
      };
      validation: {
        nameRequired: string;
        hostRequired: string;
        portRequired: string;
      };
    };
    urlOpener: {
      tabs: {
        multiOpen: string;
        slideshow: string;
        screenshot: string;
      };
      multiOpen: {
        tooltips: {
          getTabUrls: string;
          extractUrls: string;
          deduplicate: string;
          clear: string;
        };
        buttons: {
          getTabUrls: string;
          extractUrls: string;
          deduplicate: string;
          openWithCount: string;
        };
        placeholder: string;
        options: {
          ignoreDuplicates: string;
          randomOrder: string;
          currentWindow: string;
          newWindow: string;
          lineCount: string;
        };
        messages: {
          deduplicated: string;
          noValidTabUrls: string;
          fetchedTabUrls: string;
          fetchTabUrlsFailed: string;
          noUrlsExtracted: string;
          extractedUrls: string;
          inputRequired: string;
          openedUrls: string;
          openFailed: string;
          createWindowFailed: string;
        };
      };
      slideshow: {
        stayDuration: string;
        secondsPerPage: string;
        placeholder: string;
        queueTitle: string;
        queueCount: string;
        queueEmpty: string;
        queueBadge: {
          paused: string;
          completed: string;
          current: string;
        };
        progressTitle: string;
        currentUrl: string;
        countLabel: string;
        messages: {
          actionFailed: string;
          inputRequired: string;
          started: string;
          startFailed: string;
          resumed: string;
          paused: string;
          toggleFailed: string;
          stopped: string;
          stopFailed: string;
        };
      };
      screenshot: {
        placeholder: string;
        previewMask: string;
        currentUrl: string;
        imageCount: string;
        summary: {
          successCount: string;
          failedCount: string;
          successFailure: string;
        };
        statuses: {
          capturing: string;
          stopping: string;
          completed: string;
          stopped: string;
          pending: string;
        };
        buttons: {
          exportZip: string;
        };
        messages: {
          actionFailed: string;
          inputRequired: string;
          started: string;
          startFailed: string;
          stopFailed: string;
          cleared: string;
          clearFailed: string;
          exportedZip: string;
          exportZipFailed: string;
          completed: string;
          stopped: string;
        };
      };
    };
    inject: {
      tabs: {
        script: string;
        text: string;
        variable: string;
      };
      script: {
        listTitle: string;
        empty: string;
        confirmDelete: string;
        tooltips: {
          injectAll: string;
          presets: string;
          addScript: string;
          autoRun: string;
          run: string;
          edit: string;
          delete: string;
        };
        messages: {
          presetExists: string;
          presetAdded: string;
          presetAddFailed: string;
          toggleFailed: string;
          noEnabledScripts: string;
          injectedAll: string;
          injectedPartial: string;
          runSuccess: string;
          runFailed: string;
        };
        modal: {
          addTitle: string;
          editTitle: string;
          namePlaceholder: string;
          codePlaceholder: string;
          defaultCodeTemplate: string;
        };
        validation: {
          nameRequired: string;
          codeRequired: string;
        };
      };
      presets: {
        hookCryptoJs: {
          label: string;
          description: string;
        };
        hookJsEncrypt: {
          label: string;
          description: string;
        };
        forceF12: {
          label: string;
          description: string;
        };
      };
      text: {
        textLabel: string;
        placeholder: string;
        partialMode: string;
        partialModeNotice: string;
        tooltips: {
          fillAll: string;
        };
        messages: {
          inputRequired: string;
          inputFirst: string;
          filled: string;
          selectionStarted: string;
        };
        help: {
          batchFillTitle: string;
          batchFillDescription: string;
          partialFillTitle: string;
          partialFillDescription: string;
          supportedElements: string;
        };
      };
      variable: {
        keyPlaceholder: string;
        valuePlaceholder: string;
        empty: string;
        confirmDelete: string;
        fillButton: string;
        tooltips: {
          add: string;
          fill: string;
        };
        messages: {
          keyRequired: string;
          keyExists: string;
          added: string;
          inputFirst: string;
          filled: string;
        };
        help: {
          placeholderUsage: string;
          examplePlaceholder: string;
          replaceDescription: string;
          supportedElements: string;
        };
      };
    };
    note: {
      tabs: {
        notes: string;
        todo: string;
      };
      note: {
        placeholder: string;
      };
      todo: {
        inputPlaceholder: string;
        statsSummary: string;
        clearCompleted: string;
        empty: string;
        confirmDelete: string;
        messages: {
          inputRequired: string;
          noCompleted: string;
          cleared: string;
        };
      };
    };
  };
  devtools: {
    modules: {
      packetReplay: string;
      websocket: string;
      apiTest: string;
      vulnerability: string;
      codec: string;
      payloadStore: string;
      dataGenerator: string;
      diff: string;
      misc: string;
      reportWriter: string;
    };
    vulnerability: {
      layout: {
        title: string;
        subtitle: string;
        scanTypes: string;
        urlFilterPlaceholder: string;
        packetCount: string;
        scanning: string;
        scanningTip: string;
        scanButton: string;
        exportReport: string;
        emptyDescription: string;
      };
      messages: {
        noPackets: string;
        selectType: string;
        completed: string;
      };
      severities: {
        critical: string;
        high: string;
        medium: string;
        low: string;
        info: string;
      };
      types: {
        xss: string;
        sqli: string;
        redirect: string;
        leak: string;
      };
      locations: {
        requestParam: string;
        requestHeader: string;
        requestBody: string;
        responseHeader: string;
        responseBody: string;
      };
      report: {
        scanSummary: string;
        totalFindings: string;
        noFindings: string;
        allTypes: string;
        allSeverities: string;
        labels: {
          description: string;
          evidence: string;
          location: string;
          recommendation: string;
          references: string;
          url: string;
        };
      };
      export: {
        fileName: string;
        reportTitle: string;
        success: string;
      };
      engines: {
        xss: {
          name: string;
          recommendation: string;
          patterns: Record<string, string>;
          messages: {
            reflectedTitle: string;
            reflectedDescription: string;
            reflectedUnencodedTitle: string;
            reflectedUnencodedDescription: string;
            patternDetectedDescription: string;
            missingHeaderTitle: string;
            missingHeaderDescription: string;
          };
        };
        sqli: {
          name: string;
          recommendation: string;
          errorPatterns: Record<string, string>;
          paramPatterns: Record<string, string>;
          messages: {
            dbErrorDescription: string;
            paramTitle: string;
            paramDescription: string;
          };
        };
        redirect: {
          name: string;
          recommendation: string;
          messages: {
            controlledLocationTitle: string;
            controlledLocationDescription: string;
            externalLocationTitle: string;
            externalLocationDescription: string;
            externalParamTitle: string;
            externalParamDescription: string;
            metaRefreshTitle: string;
            metaRefreshDescription: string;
            urlValueTitle: string;
            urlValueDescription: string;
          };
        };
        leak: {
          name: string;
          recommendation: string;
          headerPatterns: Record<string, string>;
          bodyPatterns: Record<string, string>;
          messages: {
            headerDescription: string;
            bodyDescription: string;
          };
        };
      };
    };
    websocket: {
      layout: {
        connections: string;
        frames: string;
        detail: string;
      };
      toolbar: {
        buttons: {
          monitor: string;
          intercept: string;
          intercepting: string;
        };
        filters: {
          allDirections: string;
          sent: string;
          received: string;
          searchPlaceholder: string;
          allTypes: string;
          text: string;
          binary: string;
        };
        tooltips: {
          autoScroll: string;
          clearAll: string;
          clearCurrentFrames: string;
          startIntercept: string;
          startMonitor: string;
          stopIntercept: string;
          stopMonitor: string;
        };
      };
      connectionList: {
        empty: string;
        status: {
          connecting: string;
          open: string;
          closed: string;
          error: string;
        };
      };
      frameList: {
        selectConnection: string;
        empty: string;
        interceptQueue: string;
        incoming: string;
        outgoing: string;
        allow: string;
        drop: string;
        columns: {
          time: string;
          data: string;
          size: string;
        };
      };
      frameDetail: {
        empty: string;
        buttons: {
          send: string;
        };
        labels: {
          sent: string;
          received: string;
          edited: string;
        };
        tabs: {
          data: string;
          raw: string;
          hex: string;
        };
        tooltips: {
          copyData: string;
          edit: string;
          exitEdit: string;
          resetEdit: string;
          replay: string;
        };
        messages: {
          connectionNotFound: string;
        };
      };
    };
    reportWriter: {
      buttons: {
        createReport: string;
      };
      confirm: {
        delete: string;
      };
      defaults: {
        initialContent: string;
        untitledReport: string;
      };
      empty: {
        list: string;
        startWriting: string;
      };
      export: {
        defaultFileName: string;
        menu: {
          markdown: string;
          html: string;
          pdf: string;
        };
      };
      fields: {
        titlePlaceholder: string;
      };
      messages: {
        created: string;
        imagesPasted: string;
        markdownExported: string;
        htmlExported: string;
        pdfExported: string;
        pdfExportFailed: string;
      };
      sidebar: {
        title: string;
      };
      status: {
        unsaved: string;
      };
      tooltips: {
        createReport: string;
        saveWithAutosave: string;
      };
    };
    payloadStore: {
      sidebar: {
        groups: string;
      };
      header: {
        totalItems: string;
      };
      groups: {
        xss: {
          title: string;
          items: Record<string, string>;
        };
        sqli: {
          title: string;
          items: Record<string, string>;
        };
        cmdInjection: {
          title: string;
          items: Record<string, string>;
        };
        pathTraversal: {
          title: string;
          items: Record<string, string>;
        };
        ssti: {
          title: string;
          items: Record<string, string>;
        };
        xxe: {
          title: string;
          items: Record<string, string>;
        };
        ssrf: {
          title: string;
          items: Record<string, string>;
        };
        headerInjection: {
          title: string;
          items: Record<string, string>;
        };
      };
    };
  };
  layout: {
    sideNav: {
      expand: string;
      collapse: string;
    };
  };
}