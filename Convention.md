# Convention

## 커밋 컨벤션
커밋 컨벤션은 다음과 같은 형식을 따른다.
```
[header] [title]

[body]
```

예시:
```
feat: 공 튀기는 기능 완성

#123 에 정의된 기능 구현 완료 및 테스트 커버리지 100% 확인
```

### header
`feat:` 기능 추가, 변경

`chroe:` 기능 변경이 없는 일반적인 커밋

`style:` 코드의 스타일링과 관련된 커밋

`docs:` 코드를 직접 변경하지 않는 도큐먼트 관련 커밋

`HOTFIX:` 긴급한 버그 수정

`WIP:` 작성 중인 항목을 커밋할 때 활용

### title
가능한 한 명료하게, 한국어로 작성.

가능한 한 70자를 넘지 않도록 작성

### body
관련된 이슈 혹은 PR이 있다면 `#123` 형태로 이슈/PR을 참조하도록 작성.

다른 팀원이 보아도 이해 가능하도록 가능한 한 자세하게 작성.

## 코딩 컨벤션

### Backend
[PEP 8](https://peps.python.org/pep-0008/) 스타일 가이드를 따름.

### Frontend
[Airbnb](https://github.com/airbnb/javascript) 스타일 가이드를 따름.
