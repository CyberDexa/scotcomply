# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e5]:
      - link "ScotComply" [ref=e7] [cursor=pointer]:
        - /url: /
        - img [ref=e8] [cursor=pointer]
        - generic [ref=e11] [cursor=pointer]: ScotComply
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Sign In
          - generic [ref=e15]: Enter your credentials to access your account
        - generic [ref=e16]:
          - generic [ref=e17]:
            - generic [ref=e18]:
              - generic [ref=e19]: Email
              - textbox "Email" [ref=e20]
            - generic [ref=e21]:
              - generic [ref=e22]:
                - generic [ref=e23]: Password
                - link "Forgot password?" [ref=e24] [cursor=pointer]:
                  - /url: /auth/forgot-password
              - textbox "Password" [ref=e25]
            - button "Sign In" [ref=e26] [cursor=pointer]
          - generic [ref=e27]:
            - text: Don't have an account?
            - link "Sign up" [active] [ref=e28] [cursor=pointer]:
              - /url: /auth/signup
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e34] [cursor=pointer]:
    - img [ref=e35] [cursor=pointer]
  - alert [ref=e38]
```