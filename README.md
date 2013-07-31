page-deploy
===========

**WIP**. It is **not** stable. 

It is **not** ready for production use. It is under **heavy**
development.

I am building something simple around this now and am making changes to these scripts suddenly as needed.


----------------------------------------------------------------------
### About Locale File Deployment

Files with locale or language specific content are "locale files". An application might use locale files to render an input for a social-security-number. Locale files would describe the input for 'en-US', but not for 'es-ES', and language files would describe a label for the input, such as 'ssn number:' or 'ssn numero:'.

Organising these files is important. It will affect the way you test, deploy, translate and develop an application using them.


----------------------------------------------------------------------
### About `page-deploy`

Any file-deployment tool relies on input files being organised in some way. I have worked on applications built around poorly organised locale files. I have studied the organisation of International files by [Ruby on Rails][0], [Django][3], [Microsoft][4], [Jquery][6], [Mozilla][5], [Apple][10] and by the [Unicode Consortium][1]. This tool is a product of that experience. 

 Decisions made by this software:

 1. **JSON** as the primary data format.
 2. **Join** files around subjects they describe.
 3. **Separate** locale files from language files.
 4. **Separate** descriptive rules from data definitions.
 5. **Separate** files from any subject platform or codebase.
 6. **Define** data in two ways only: element, array of elements.
 7. **No Config File**


Web applications require some control over the number of requests needed to obtain data and the size of that data. To allow control, some data should be available as both an element and an array of elements.


[0]: http://guides.rubyonrails.org/v2.3.11/i18n.html             "ror"
[1]: http://www.unicode.org/repos/cldr-aux/json/22.1/        "unicode"
[2]: mailto:chris@bumblehead.com?subject=locale-converter      "chris"
[3]: docs.djangoproject.com/en/1.3/topics/i18n/localization/  "django"
[4]: msdn.microsoft.com/en-us/library/ff647353.aspx        "microsoft"
[5]: developer.mozilla.org/en-US/docs/Web_Localizability/Creating_localizable_web_applications        "mdn"
[6]: https://github.com/wikimedia/jquery.i18n/wiki/API        "jquery"
[7]: https://kuapay.com                                       "kuapay"


----------------------------------------------------------------------
### Overview


A directory named 'getStarted' is provided with page-deploy. Its directory and file-naming scheme are supported. A full layout of the directory with the `tree` command:
 
```bash
$ tree -L 10 ./convert
./convert
├── data
│   ├── type-country
│   │   └── arr
│   │       └── baseLang.json
│   ├── type-municipality
│   │   └── arr
│   │       ├── baseLangLocale.json
│   │       ├── eng-US_ES.json
│   │       ├── eng-US_US.json
│   │       ├── spa-ES_ES.json
│   │       └── spa-ES_US.json
│   └── user-agreement
│       └── elements
│           ├── baseLocale.md
│           ├── ES.md
│           └── US.md
├── defaults
│   ├── error
│   │   └── baseLang.json
│   └── unicode
│       └── baseLang.json
└── page-object
    ├── blog
    │   └── blocks
    │       └── blog-list
    │           ├── baseLang.json
    │           └── data
    │               ├── arr
    │               │   └── baseLang.json
    │               └── elements
    │                   ├── big-update
    │                   │   ├── baseLang.md
    │                   │   └── support
    │                   │       └── img
    │                   │           ├── about-screen.jpg
    │                   │           ├── full
    │                   │           ├── linux-screen.jpg
    │                   │           ├── stobo_linux2.png
    │                   │           ├── stobo_linux.png
    │                   │           ├── stobo-osx.jpg
    │                   │           └── vista-screen.jpg
    │                   ├── making-waves
    │                   │   ├── baseLang.md
    │                   │   └── support
    │                   │       └── img
    │                   │           ├── emacs-screenshot.jpg
    │                   │           ├── full
    │                   │           ├── render.jpg
    │                   │           ├── sine-evolution.jpg
    │                   │           └── testing.jpg
    │                   └── writing-javascript
    │                       └── baseLang.md
    ├── canvas
    │   ├── baseLocale.json
    │   └── blocks
    │       └── nav-top
    │           └── baseLocale.json
    └── forms
        └── blocks
            ├── sign-in
            │   ├── baseLocale.json
            │   └── inputs
            │       ├── email
            │       │   └── baseLocale.json
            │       ├── password
            │       │   └── baseLocale.json
            │       └── submit
            │           └── baseLocale.json
            └── sign-up
                ├── baseLocale.json
                └── inputs
                    ├── country
                    │   └── baseLocale.json
                    ├── name
                    │   └── baseLocale.json
                    ├── submit
                    │   └── baseLocale.json
                    ├── time-bgn
                    │   └── baseLocale.json
                    └── time-end
                        └── baseLocale.json
```


The example shows files grouped by 'defaults', 'data' and 'page-object'. Another* grouping could be used. I recommend the grouping used in the example.


*`Ruby on Rails` groups data by 'models' and 'views'.

----------------------------------------------------------------------
#### Overview, Data

Fewer files are needed when an application supports these scenarios:

 1. **`lang`**
    _data is same for each locale, but is different by language_
    
    * A group of categories, such as 'food' and 'health'. One data is defined for all locales -with translations.        

      `categories/baseLang.json`
      `categories/eng-US.json`
      `categories/spa-ES.json`
      `categories/spa-CL.json`
    
 2. **`locale`**
    _data differs for each locale, but is one language for each_
    
    * A legal document, such as a 'user agreement'. Specific data for each locale is defined -no translations.

      `terms-and-conditions/baseLocale.json`
      `terms-and-conditions/US.json`
      `terms-and-conditions/ES.json`
      `terms-and-conditions/CL.json`

 3. **`lang-locale`**
    _data differs for each locale and language_
    
    * A list of banks, sub-regions (prefectures or states) or payment gateways. Specific data for each locale is defined -with translations.    

      `municipalities/baseLangLocaleArr.json`
      `municipalities/eng-US_USArr.json`
      `municipalities/eng-US_ESArr.json`
      `municipalities/eng-US_CLArr.json`
      `municipalities/spa-ES_USArr.json`
      `municipalities/spa-ES_ESArr.json`
      `municipalities/spa-ES_CLArr.json`
      `municipalities/spa-CL_USArr.json`
      `municipalities/spa-CL_ESArr.json`
      `municipalities/spa-CL_CLArr.json`


A data might differ only by 'lang' or 'locale'. If your application supports 3 locales and 3 languages does this data need to exist in 9 files or 3?

locale-converter uses ISO standard [language][9] and [locale][9] codes. It also uses a naming convention I copied from [Apple][10]. 'ES' designates the locale of Spain and 'spa-ES' designates Spanish language used in Spain. 'spa-ES_CL' designates spanish language of Spain, for the Chilean locale.

```
This website provides two sets of language codes as part of the ISO 639 standard, one as a two-letter code set (639-1) and another as a three-letter code set (this part of ISO 639) for the representation of names of languages. ISO 639-1 was devised primarily for use in terminology, lexicography and linguistics. ISO 639-2 represents all languages contained in ISO 639-1 and in addition any other language as well as language groups as they may be coded for special purposes when more specificity in coding is needed. The languages listed in ISO 639-1 are a subset of the languages listed in ISO 639-2; every language code in the two-letter code set has a corresponding language code in the alpha-3 list, but not necessarily vice versa. 
```

[8]: http://www.iso.org/iso/country_names_and_code_elements_txt "iso country"
[9]: http://www.loc.gov/standards/iso639-2/ISO-639-2_8859-1.txt "iso lang"
[10]: http://developer.apple.com/library/ios/#documentation/MacOSX/Conceptual/BPInternational/Articles/LanguageDesignations.html#//apple_ref/doc/uid/20002144-SW3 "apple lang-locale"




----------------------------------------------------------------------
#### Overview, Page Objects

Reference smaller files from another file -page-deploy will build that new file for you. 


----------------------------------------------------------------------
#### Overview, Support Files

Use local paths to support files such as images. page-deploy will update the paths to web accessible ones.
